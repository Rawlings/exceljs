const oneDepthCopy = (obj: Record<string, any>, nestKeys: string[]) => ({
  ...obj,
  ...Object.fromEntries(
    nestKeys.filter((key) => Boolean(obj[key])).map((key) => [key, { ...obj[key] }])
  ),
});

const setIfExists = (
  src: Record<string, any>,
  dst: Record<string, any>,
  key: string,
  nestKeys: string[] = []
) => {
  if (src[key]) dst[key] = oneDepthCopy(src[key], nestKeys);
};

const isEmptyObj = (obj: Record<string, any>) => Object.keys(obj).length === 0;

const copyStyle = (style: any): any => {
  if (!style) return style;
  if (isEmptyObj(style)) return {};

  const copied: Record<string, any> = { ...style };

  setIfExists(style, copied, 'font', ['color']);
  setIfExists(style, copied, 'alignment');
  setIfExists(style, copied, 'protection');
  if (style.border) {
    setIfExists(style, copied, 'border');
    setIfExists(style.border, copied.border, 'top', ['color']);
    setIfExists(style.border, copied.border, 'left', ['color']);
    setIfExists(style.border, copied.border, 'bottom', ['color']);
    setIfExists(style.border, copied.border, 'right', ['color']);
    setIfExists(style.border, copied.border, 'diagonal', ['color']);
  }

  if (style.fill) {
    setIfExists(style, copied, 'fill', ['fgColor', 'bgColor', 'center']);
    if (style.fill.stops && Array.isArray(style.fill.stops)) {
      copied.fill.stops = style.fill.stops.map((s: any) => oneDepthCopy(s, ['color']));
    }
  }

  return copied;
};

export { copyStyle };
export default copyStyle;
