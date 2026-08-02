import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import path from 'node:path';

const parityFilePath = path.resolve(__dirname, '../../fixtures/parity.d.ts');
const indexFilePath = path.resolve(__dirname, '../../src/index.ts');

function createProgramForParity() {
  const rootFiles = [parityFilePath, indexFilePath];
  return ts.createProgram(rootFiles, {
    target: ts.ScriptTarget.ES2024,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    allowJs: true,
    noEmit: true,
  });
}

interface InterfaceInfo {
  name: string;
  properties: Map<string, { optional: boolean; typeText: string }>;
  methods: Map<string, { optional: boolean; parameters: string[]; returnType: string }>;
  extends: string[];
}

interface EnumInfo {
  name: string;
  members: Map<string, string | number | undefined>;
}

interface TypeAliasInfo {
  name: string;
  typeText: string;
}

interface ClassInfo {
  name: string;
  properties: Map<string, { optional: boolean; typeText: string }>;
  methods: Map<string, { optional: boolean; parameters: string[]; returnType: string }>;
}

function parseParityDeclarations(sourceFile: ts.SourceFile) {
  const interfaces = new Map<string, InterfaceInfo>();
  const enums = new Map<string, EnumInfo>();
  const typeAliases = new Map<string, TypeAliasInfo>();
  const classes = new Map<string, ClassInfo>();

  function extractInterface(node: ts.InterfaceDeclaration): InterfaceInfo {
    const name = node.name.text;
    const properties = new Map<string, { optional: boolean; typeText: string }>();
    const methods = new Map<string, { optional: boolean; parameters: string[]; returnType: string }>();
    const extendsList: string[] = [];

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const typeNode of clause.types) {
            extendsList.push(typeNode.getText(sourceFile).trim());
          }
        }
      }
    }

    for (const member of node.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText(sourceFile).trim();
        const optional = Boolean(member.questionToken);
        const typeText = member.type ? member.type.getText(sourceFile).trim() : 'any';
        properties.set(propName, { optional, typeText });
      } else if (ts.isMethodSignature(member) && member.name) {
        const methodName = member.name.getText(sourceFile).trim();
        const optional = Boolean(member.questionToken);
        const parameters = member.parameters.map((p) => p.getText(sourceFile).trim());
        const returnType = member.type ? member.type.getText(sourceFile).trim() : 'void';
        methods.set(methodName, { optional, parameters, returnType });
      }
    }

    return { name, properties, methods, extends: extendsList };
  }

  function extractEnum(node: ts.EnumDeclaration): EnumInfo {
    const name = node.name.text;
    const members = new Map<string, string | number | undefined>();

    for (const member of node.members) {
      const memberName = member.name.getText(sourceFile).trim();
      let value: string | number | undefined;
      if (member.initializer) {
        const initText = member.initializer.getText(sourceFile).trim();
        if (!Number.isNaN(Number(initText))) {
          value = Number(initText);
        } else {
          value = initText.replace(/^['"]|['"]$/g, '');
        }
      }
      members.set(memberName, value);
    }

    return { name, members };
  }

  function extractTypeAlias(node: ts.TypeAliasDeclaration): TypeAliasInfo {
    const name = node.name.text;
    const typeText = node.type.getText(sourceFile).trim();
    return { name, typeText };
  }

  function extractClass(node: ts.ClassDeclaration): ClassInfo {
    const name = node.name ? node.name.text : 'AnonymousClass';
    const properties = new Map<string, { optional: boolean; typeText: string }>();
    const methods = new Map<string, { optional: boolean; parameters: string[]; returnType: string }>();

    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member) && member.name) {
        const propName = member.name.getText(sourceFile).trim();
        const optional = Boolean(member.questionToken);
        const typeText = member.type ? member.type.getText(sourceFile).trim() : 'any';
        properties.set(propName, { optional, typeText });
      } else if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText(sourceFile).trim();
        const optional = Boolean(member.questionToken);
        const parameters = member.parameters.map((p) => p.getText(sourceFile).trim());
        const returnType = member.type ? member.type.getText(sourceFile).trim() : 'void';
        methods.set(methodName, { optional, parameters, returnType });
      }
    }

    return { name, properties, methods };
  }

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      const info = extractInterface(statement);
      interfaces.set(info.name, info);
    } else if (ts.isEnumDeclaration(statement)) {
      const info = extractEnum(statement);
      enums.set(info.name, info);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      const info = extractTypeAlias(statement);
      typeAliases.set(info.name, info);
    } else if (ts.isClassDeclaration(statement)) {
      const info = extractClass(statement);
      classes.set(info.name, info);
    }
  }

  return { interfaces, enums, typeAliases, classes };
}

describe('AST Type Parity 1:1 Diffing (parity.d.ts vs src/index.ts exports)', () => {
  const program = createProgramForParity();
  const checker = program.getTypeChecker();

  const paritySourceFile = program.getSourceFile(parityFilePath);
  const indexSourceFile = program.getSourceFile(indexFilePath);

  if (!paritySourceFile) {
    throw new Error(`Could not find baseline declaration file at ${parityFilePath}`);
  }
  if (!indexSourceFile) {
    throw new Error(`Could not find src entrypoint file at ${indexFilePath}`);
  }

  const parity = parseParityDeclarations(paritySourceFile);

  const indexSymbol = checker.getSymbolAtLocation(indexSourceFile);
  const exportedSymbols = indexSymbol ? checker.getExportsOfModule(indexSymbol) : [];
  const exportedNames = new Set(exportedSymbols.map((s) => s.name));

  it('should parse baseline parity.d.ts successfully', () => {
    expect(paritySourceFile).toBeDefined();
    expect(parity.enums.size).toBeGreaterThan(0);
    expect(parity.interfaces.size).toBeGreaterThan(0);
    expect(parity.typeAliases.size).toBeGreaterThan(0);
  });

  describe('Enum 1:1 Parity', () => {
    for (const [enumName, parityEnum] of parity.enums.entries()) {
      it(`Enum "${enumName}" should exist in exported types`, () => {
        expect(exportedNames.has(enumName), `Enum "${enumName}" missing from src exports`).toBe(true);
      });

      it(`Enum "${enumName}" members and values should match 1:1`, () => {
        const exportedSymbol = exportedSymbols.find((s) => s.name === enumName);
        if (!exportedSymbol) return;

        const symbol = (exportedSymbol.flags & ts.SymbolFlags.Alias)
          ? checker.getAliasedSymbol(exportedSymbol)
          : exportedSymbol;

        const declarations = symbol.getDeclarations() || [];
        const enumDecl = declarations.find(ts.isEnumDeclaration);
        expect(enumDecl, `Enum declaration for "${enumName}" missing`).toBeDefined();
        if (!enumDecl) return;

        expect(enumDecl.members.length, `Enum "${enumName}" member count mismatch`).toBe(parityEnum.members.size);

        for (const [memberName, expectedValue] of parityEnum.members.entries()) {
          const memberNode = enumDecl.members.find(
            (m) => m.name.getText().trim() === memberName
          );
          expect(memberNode, `Enum member "${enumName}.${memberName}" missing in src`).toBeDefined();
          if (expectedValue !== undefined && memberNode?.initializer) {
            const actualInitText = memberNode.initializer.getText().trim();
            const actualValue = !Number.isNaN(Number(actualInitText))
              ? Number(actualInitText)
              : actualInitText.replace(/^['"]|['"]$/g, '');
            expect(actualValue, `Enum value for "${enumName}.${memberName}"`).toEqual(expectedValue);
          }
        }
      });
    }
  });

  describe('Interface 1:1 Property & Optionality Parity', () => {
    for (const [interfaceName, parityInterface] of parity.interfaces.entries()) {
      // Ignore global Buffer augmentation in parity.d.ts
      if (interfaceName === 'Buffer') continue;

      it(`Interface "${interfaceName}" should exist in exported symbols`, () => {
        expect(exportedNames.has(interfaceName), `Export for interface "${interfaceName}" missing in src/index.ts`).toBe(true);
      });

      it(`Interface "${interfaceName}" properties & optionality should match 1:1`, () => {
        const exportedSymbol = exportedSymbols.find((s) => s.name === interfaceName);
        if (!exportedSymbol) return;

        const symbol = (exportedSymbol.flags & ts.SymbolFlags.Alias)
          ? checker.getAliasedSymbol(exportedSymbol)
          : exportedSymbol;

        const declarations = symbol.getDeclarations() || [];
        const targetDecl = declarations.find(
          (d) => ts.isInterfaceDeclaration(d) || ts.isClassDeclaration(d) || ts.isTypeAliasDeclaration(d)
        );
        expect(targetDecl, `No interface/class declaration found for exported symbol "${interfaceName}"`).toBeDefined();

        if (targetDecl && (ts.isInterfaceDeclaration(targetDecl) || ts.isClassDeclaration(targetDecl))) {
          const srcPropMap = new Map<string, { optional: boolean }>();
          for (const member of targetDecl.members) {
            if (member.name) {
              const propName = member.name.getText().trim();
              const optional = Boolean(member.questionToken);
              srcPropMap.set(propName, { optional });
            }
          }

          for (const [propName, parityProp] of parityInterface.properties.entries()) {
            const srcProp = srcPropMap.get(propName);
            expect(srcProp, `Property "${interfaceName}.${propName}" missing in src`).toBeDefined();
            if (srcProp && !parityProp.optional) {
              // If property is required in baseline parity.d.ts, it must not be optional in src
              expect(srcProp.optional, `Required property "${interfaceName}.${propName}" is optional in src`).toBe(false);
            }
          }
        }
      });
    }
  });

  describe('Type Alias 1:1 Export Parity', () => {
    for (const [typeAliasName] of parity.typeAliases.entries()) {
      it(`TypeAlias "${typeAliasName}" should be exported in src/index.ts`, () => {
        expect(exportedNames.has(typeAliasName), `Export for type alias "${typeAliasName}" missing in src/index.ts`).toBe(true);
      });
    }
  });
});
