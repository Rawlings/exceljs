type StyleRecord = Record<string, unknown>;

const oneDepthCopy = (obj: StyleRecord, nestKeys: string[]): StyleRecord => ({
  ...obj,
  ...Object.fromEntries(
    nestKeys
      .filter((key) => Boolean(obj[key]))
      .map((key) => [key, { ...(obj[key] as StyleRecord) }])
  ),
});

const setIfExists = (src: StyleRecord, dst: StyleRecord, key: string, nestKeys: string[] = []) => {
  if (src[key]) dst[key] = oneDepthCopy(src[key] as StyleRecord, nestKeys);
};

const isEmptyObj = (obj: StyleRecord) => Object.keys(obj).length === 0;

const copyStyle = (style: StyleRecord | undefined | null): StyleRecord | undefined | null => {
  if (!style) return style;
  if (isEmptyObj(style)) return {};

  const copied: StyleRecord = { ...style };

  setIfExists(style, copied, 'font', ['color']);
  setIfExists(style, copied, 'alignment');
  setIfExists(style, copied, 'protection');
  if (style.border) {
    setIfExists(style, copied, 'border');
    const border = style.border as StyleRecord;
    const copiedBorder = copied.border as StyleRecord;
    setIfExists(border, copiedBorder, 'top', ['color']);
    setIfExists(border, copiedBorder, 'left', ['color']);
    setIfExists(border, copiedBorder, 'bottom', ['color']);
    setIfExists(border, copiedBorder, 'right', ['color']);
    setIfExists(border, copiedBorder, 'diagonal', ['color']);
  }

  if (style.fill) {
    setIfExists(style, copied, 'fill', ['fgColor', 'bgColor', 'center']);
    const fill = style.fill as StyleRecord;
    if (fill.stops && Array.isArray(fill.stops)) {
      (copied.fill as StyleRecord).stops = (fill.stops as StyleRecord[]).map((s) =>
        oneDepthCopy(s, ['color'])
      );
    }
  }

  return copied;
};

export { copyStyle };
export default copyStyle;
