const oneDepthCopy = (obj: any, nestKeys: any) => ({
  ...obj,
  ...nestKeys.reduce((memo: any, key: any) => {
    if (obj[key]) memo[key] = { ...obj[key] };
    return memo;
  }, {}),
});

const setIfExists = (src: any, dst: any, key: any, nestKeys: any = []) => {
  if (src[key]) dst[key] = oneDepthCopy(src[key], nestKeys);
};

const isEmptyObj = (obj: any) => Object.keys(obj).length === 0;

const copyStyle = (style: any) => {
  if (!style) return style;
  if (isEmptyObj(style)) return {};

  const copied = { ...style };

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
    if (style.fill.stops) {
      copied.fill.stops = style.fill.stops.map((s: any) => oneDepthCopy(s, ['color']));
    }
  }

  return copied;
};

export { copyStyle };
