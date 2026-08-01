import fs from 'fs';
import path from 'path';

// theme1.xml fixture loader
const theme1Path = path.resolve(process.cwd(), 'fixtures/theme1.xml');
const theme1Xml = fs.existsSync(theme1Path)
  ? fs.readFileSync(theme1Path, 'utf8')
  : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"/>';

export default theme1Xml;
