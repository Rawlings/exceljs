import type { Color, Style } from './cell';

export type CellIsOperators = 'equal' | 'greaterThan' | 'lessThan' | 'between';

export type ContainsTextOperators =
  | 'containsText'
  | 'containsBlanks'
  | 'notContainsBlanks'
  | 'containsErrors'
  | 'notContainsErrors';

export type TimePeriodTypes =
  | 'lastWeek'
  | 'thisWeek'
  | 'nextWeek'
  | 'yesterday'
  | 'today'
  | 'tomorrow'
  | 'last7Days'
  | 'lastMonth'
  | 'thisMonth'
  | 'nextMonth';

export type IconSetTypes =
  | '5Arrows'
  | '5ArrowsGray'
  | '5Boxes'
  | '5Quarters'
  | '5Rating'
  | '4Arrows'
  | '4ArrowsGray'
  | '4Rating'
  | '4RedToBlack'
  | '4TrafficLights'
  | 'NoIcons'
  | '3Arrows'
  | '3ArrowsGray'
  | '3Flags'
  | '3Signs'
  | '3Stars'
  | '3Symbols'
  | '3Symbols2'
  | '3TrafficLights1'
  | '3TrafficLights2'
  | '3Triangles';

export type CfvoTypes =
  | 'percentile'
  | 'percent'
  | 'num'
  | 'min'
  | 'max'
  | 'formula'
  | 'autoMin'
  | 'autoMax';

export interface Cvfo {
  type: CfvoTypes;
  value?: number;
}

export interface ConditionalFormattingBaseRule {
  priority: number;
  style?: Partial<Style>;
}

export interface ExpressionRuleType extends ConditionalFormattingBaseRule {
  type: 'expression';
  formulae?: any[];
}

export interface CellIsRuleType extends ConditionalFormattingBaseRule {
  type: 'cellIs';
  formulae?: any[];
  operator?: CellIsOperators;
}

export interface Top10RuleType extends ConditionalFormattingBaseRule {
  type: 'top10';
  rank: number;
  percent: boolean;
  bottom: boolean;
}

export interface AboveAverageRuleType extends ConditionalFormattingBaseRule {
  type: 'aboveAverage';
  aboveAverage: boolean;
}

export interface ColorScaleRuleType extends ConditionalFormattingBaseRule {
  type: 'colorScale';
  cfvo?: Cvfo[];
  color?: Partial<Color>[];
}

export interface IconSetRuleType extends ConditionalFormattingBaseRule {
  type: 'iconSet';
  showValue?: boolean;
  reverse?: boolean;
  custom?: boolean;
  iconSet?: IconSetTypes;
  cfvo?: Cvfo[];
}

export interface ContainsTextRuleType extends ConditionalFormattingBaseRule {
  type: 'containsText';
  operator?: ContainsTextOperators;
  text?: string;
}

export interface TimePeriodRuleType extends ConditionalFormattingBaseRule {
  type: 'timePeriod';
  timePeriod?: TimePeriodTypes;
}

export interface DataBarRuleType extends ConditionalFormattingBaseRule {
  type: 'dataBar';
  gradient?: boolean;
  minLength?: number;
  maxLength?: number;
  showValue?: boolean;
  border?: boolean;
  negativeBarColorSameAsPositive?: boolean;
  negativeBarBorderColorSameAsPositive?: boolean;
  axisPosition?: 'auto' | 'middle' | 'none';
  direction?: 'context' | 'leftToRight' | 'rightToLeft';
  cfvo?: Cvfo[];
}

export type ConditionalFormattingRule =
  | ExpressionRuleType
  | CellIsRuleType
  | Top10RuleType
  | AboveAverageRuleType
  | ColorScaleRuleType
  | IconSetRuleType
  | ContainsTextRuleType
  | TimePeriodRuleType
  | DataBarRuleType;

export interface ConditionalFormattingOptions {
  ref: string;
  rules: ConditionalFormattingRule[];
}
