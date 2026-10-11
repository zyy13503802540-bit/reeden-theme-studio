// 阅读主题格式转换核心（Readingo .rgshare/.rgshare2 / Reeden .red / 阅读 MD3 / Archive 互转）
// 提取自"阅读主题转换器"（作者：无异；red 与 rg 互转基于 Chi 老师的 Skill）
// 资源字节原样搬运，不重编码；浏览器端运行（canvas + DecompressionStream）

const REFERENCE_LAYOUT = {
 "annotationFontSize": -1.0,
 "applePencilDoubleTapAction": "nextPage",
 "applePencilSqueezeAction": "none",
 "autoDoublePageOnVertical": false,
 "autoPagerSpeed": 1.0,
 "bottomAlignment": true,
 "boxDecorationBreakMode": "clone",
 "contentAlign": "defaults",
 "contentPaddingBottom": 0.0,
 "contentPaddingTop": 0.0,
 "cssBackgroundImageScaleMode": "auto",
 "cssLineHeightMode": "defaults",
 "cssParagraphSpacingMode": "defaults",
 "customTemplateFooterCenter": "",
 "customTemplateFooterLeft": "",
 "customTemplateFooterRight": "",
 "customTemplateHeaderCenter": "",
 "customTemplateHeaderLeft": "",
 "customTemplateHeaderRight": "",
 "darkModeImageOpacity": 1.0,
 "desktopClickTurnPageEnabled": true,
 "desktopLongPressOpenImageEnabled": false,
 "desktopSelectMenuImmediately": true,
 "disableTapTurnPageAnimation": false,
 "doublePageDividerWidth": 0.0,
 "doublePageGap": 70.0,
 "doublePageType": "singlePage",
 "enableBionicReading": false,
 "enableCssBackground": true,
 "enableCssBackgroundColor": true,
 "enableCssFont": true,
 "enableCssFontColor": true,
 "enableCssFontSize": true,
 "enableCssFontStyle": true,
 "enableCssFontWeight": true,
 "enableCssPadding": true,
 "enableCssStyle": true,
 "enableCssTextAlignIndent": true,
 "enableCssVisualEffect": true,
 "enableDarkModeImageInvert": false,
 "enableFloatLayout": true,
 "enableTableFontSizeScale": true,
 "englishFontFamily": null,
 "englishHyphenationMode": "noHyphen",
 "fontBold": 1,
 "fontFamily": "ABC0334D5CF36EF73ED52E6BF3089CCF",
 "fontSize": 12.0,
 "footerPaddingBottom": 26.78092447916572,
 "footerPaddingLeft": 0.0,
 "footerPaddingRight": 0.0,
 "footerPaddingTop": 30.595377604166742,
 "footerStatusBarFontSize": null,
 "headerPaddingBottom": 10.0,
 "headerPaddingLeft": 0.0,
 "headerPaddingRight": -2.0,
 "headerPaddingTop": 36.81747581845247,
 "headerStatusBarFontSize": null,
 "horizontalSwipeBackgroundFollowPageTurn": false,
 "horizontalSwipePageTurnEnabled": true,
 "ignoreBlankParagraph": false,
 "leftToRightPageTurn": false,
 "letterSpacing": 1.5,
 "lineSpacing": 15.0,
 "lineUnderlineDashLength": 4,
 "lineUnderlineExcludeTitle": true,
 "lineUnderlineFullWidth": true,
 "lineUnderlineHeight": 0.5,
 "lineUnderlineOffset": 4.0,
 "lineUnderlineOpacity": 40,
 "lineUnderlineStyle": "dashed",
 "naturalScrolling": true,
 "noteDefaultColor": "accent",
 "noteDefaultStyle": "dashed",
 "openccType": "t2s",
 "paddingLeft": 20.0,
 "paddingRight": 20.0,
 "pageFrameColor": null,
 "pageFrameFillColor": null,
 "pageFrameFillOpacity": 0,
 "pageFrameImage": null,
 "pageFrameImageSlice": null,
 "pageFrameOpacity": 40,
 "pageFrameRadius": 0.0,
 "pageFrameStyle": "none",
 "pageFrameWidth": 1.0,
 "paragraphIndent": "defaults",
 "paragraphSpacing": 25.0,
 "pinAppbar": false,
 "pinRightSidebar": false,
 "pinSidebar": false,
 "processType": "chapterPage",
 "pullDownBookmark": true,
 "pullUpExit": false,
 "rightSidebarWidth": 300.0,
 "scrollTapTurnPageEnabled": true,
 "showBatteryPercent": false,
 "showFootnoteDefinition": false,
 "sidebarWidth": 300.0,
 "singleHandMode": false,
 "statusBarFontFamily": null,
 "statusBarFontSize": 10.5,
 "statusItemTypeFooterCenter": "none",
 "statusItemTypeFooterLeft": "battery",
 "statusItemTypeFooterRight": "pageInBookPercent",
 "statusItemTypeHeaderCenter": "none",
 "statusItemTypeHeaderLeft": "chapterName",
 "statusItemTypeHeaderRight": "pageInChapter",
 "textFontWeight": 1,
 "textJustificationMode": "all",
 "titleAlign": "defaults",
 "titleBoldEnabled": true,
 "titleFontBold": 7,
 "titleFontFamily": null,
 "titleFontSizeDiff": 0.0,
 "titleMarginTop": 20.0,
 "titlePaddingBottom": 0.0,
 "titleStyleId": null,
 "translucentLayoutPageOpacity": 0.45,
 "turnPageType": "fadeIn",
 "txtTitleFontSizeDiff": 6.0,
 "useBottomSafeArea": true,
 "useLeftSafeArea": true,
 "useRightSafeArea": true,
 "useTopSafeArea": true,
 "volumeTurnPageEnabled": true,
 "writingMode": "defaults"
}
const THEME_SKELETON = {
 "appColumnBackgroundOpacity": 60,
 "appTheme": "12",
 "baseCardBorderColor": -1476425592,
 "baseCardBorderColorNight": 0,
 "baseCardBorderWidth": 0.1,
 "baseCardCornerRadius": 0.0,
 "bgImageBlurring": 0,
 "bgImageNBlurring": 0,
 "bookInfoBackgroundBlur": "on",
 "bookInfoDefaultCoverBackground": "on",
 "bookInfoFollowCoverColor": true,
 "bookInfoInputColor": 0,
 "bookInfoNetworkCoverBackground": "on",
 "bookshelfCardColor": 251658239,
 "bookshelfCardColorDark": 0,
 "bottomBarBlurAlpha": 40,
 "bottomBarBlurRadius": 8,
 "bottomBarLensRadius": 24.0,
 "bottomBarOpacity": 100,
 "cNPrimary": 0,
 "cPrimary": 0,
 "composeEngine": "material",
 "containerOpacity": 84,
 "coverDefaultColor": true,
 "coverDefaultImage": "",
 "coverDefaultImageDark": "",
 "coverInfoOrientation": "0",
 "coverLoadOnlyWifi": false,
 "coverShadowColor": -16777216,
 "coverShadowColorN": -1,
 "coverShowAuthor": true,
 "coverShowAuthorN": true,
 "coverShowName": false,
 "coverShowNameN": false,
 "coverShowShadow": false,
 "coverShowStroke": true,
 "coverTextColor": -16777216,
 "coverTextColorN": -1,
 "coverUseDefault": true,
 "customContrast": "Default",
 "customMode": "global",
 "defaultHomePage": "bookshelf",
 "disableSplicedColumnGroupCornerRadius": false,
 "enableBlur": false,
 "enableContainerBackgroundImage": true,
 "enableCustomTagColors": false,
 "enableDeepPersonalization": true,
 "enableItemDivider": false,
 "enableProgressiveBlur": false,
 "fontScale": 10,
 "glassCardBackgroundOpacity": 14,
 "isPredictiveBackEnabled": true,
 "isPureBlack": false,
 "itemDividerColor": 0,
 "itemDividerLength": 80.0,
 "itemDividerWidth": 1.0,
 "labelContainerColor": -1124073473,
 "labelContainerColorNight": 0,
 "labelVisibilityMode": "unlabeled",
 "launcherIcon": "ic_launcher",
 "mainNavigationOrder": "home,bookshelf,explore,rss,my",
 "materialVersion": "material3",
 "mergeTopBarActions": false,
 "navIconBookshelf": "",
 "navIconBookshelfSelected": "",
 "navIconExplore": "",
 "navIconExploreSelected": "",
 "navIconHome": "",
 "navIconHomeSelected": "",
 "navIconMy": "",
 "navIconMySelected": "",
 "navIconRss": "",
 "navIconRssSelected": "",
 "overrideBaseCardBorder": false,
 "overrideBaseCardCornerRadius": true,
 "paletteStyle": "tonalSpot",
 "primaryTextColor": -16777216,
 "primaryTextColorNight": 0,
 "secondaryTextColor": -1207959552,
 "secondaryTextColorNight": 0,
 "secondaryThemeColor": 436207615,
 "secondaryThemeColorNight": 0,
 "selectedCoverAlbumId": "",
 "showBottomView": true,
 "showDiscovery": true,
 "showHome": true,
 "showRss": true,
 "showStatusBar": true,
 "swipeAnimation": true,
 "tabletInterface": "auto",
 "themeBackgroundColor": -771751937,
 "themeBackgroundColorNight": 0,
 "themeColor": 1814307876,
 "themeColorNight": 0,
 "themeMode": "0",
 "topBarBlurAlpha": 73,
 "topBarBlurRadius": 24,
 "topBarButtonStyle": "tonal",
 "topBarOpacity": 100,
 "useFlexibleTopAppBar": true,
 "useFloatingBottomBar": true,
 "useFloatingBottomBarLiquidGlass": true,
 "useMiuixMonet": false
}
const READCONFIG_SKELETON = {
 "applyHeaderStyle": false,
 "bgAlpha": 100,
 "bgStr": "",
 "bgStrEInk": "#FFFFFF",
 "bgStrNight": "#000000",
 "bgType": 2,
 "bgTypeEInk": 0,
 "bgTypeNight": 0,
 "customTipFooterLeft": "",
 "customTipFooterMiddle": "",
 "customTipFooterRight": "",
 "customTipHeaderLeft": "",
 "customTipHeaderMiddle": "",
 "customTipHeaderRight": "",
 "darkStatusIcon": true,
 "darkStatusIconEInk": true,
 "darkStatusIconNight": false,
 "dottedBase": 15.0,
 "dottedLine": true,
 "dottedRatio": 6.0,
 "footerFont": "",
 "footerFontSize": 12,
 "footerMode": 0,
 "footerPaddingBottom": 6,
 "footerPaddingLeft": 16,
 "footerPaddingRight": 16,
 "footerPaddingTop": 6,
 "headerFont": "",
 "headerFontSize": 12,
 "headerMode": 0,
 "headerPaddingBottom": 0,
 "headerPaddingLeft": 16,
 "headerPaddingRight": 16,
 "headerPaddingTop": 0,
 "highlightRules": [],
 "letterSpacing": 0.1,
 "lineSpacingExtra": 12,
 "name": "",
 "paddingBottom": 6,
 "paddingLeft": 20,
 "paddingRight": 20,
 "paddingTop": 180,
 "pageAnim": 0,
 "pageAnimEInk": 4,
 "pageAnimSpeed": 2,
 "paragraphIndent": "　　　",
 "paragraphSpacing": 2,
 "shadowColor": "#3E3D3B",
 "shadowColorN": "#3E3D3B",
 "shadowDx": 1.0,
 "shadowDy": 1.0,
 "shadowRadius": 16.0,
 "showFooterLine": false,
 "showHeaderLine": false,
 "textAccentColor": "#834E00",
 "textAccentColorEInk": "#000000",
 "textAccentColorNight": "#FE4D55",
 "textBold": 500,
 "textColor": "#3E3D3B",
 "textColorEInk": "#000000",
 "textColorNight": "#ADADAD",
 "textFont": "",
 "textItalic": false,
 "textShadow": false,
 "textSize": 18,
 "tipDividerColor": -1,
 "tipFooterColor": -13421824,
 "tipFooterColorNight": 0,
 "tipFooterLeft": 1,
 "tipFooterMiddle": 0,
 "tipFooterRight": 6,
 "tipHeaderColor": 0,
 "tipHeaderColorNight": 0,
 "tipHeaderLeft": 2,
 "tipHeaderMiddle": 0,
 "tipHeaderRight": 3,
 "titleBold": 500,
 "titleBottomSpacing": 0,
 "titleColor": 0,
 "titleColorNight": 0,
 "titleFont": "",
 "titleLineSpacingExtra": 12,
 "titleLineSpacingSub": 12,
 "titleMode": 1,
 "titleSegDistance": 4,
 "titleSegFlag": "",
 "titleSegScaling": 1.0,
 "titleSegType": 0,
 "titleSize": 25,
 "titleTopSpacing": 0,
 "underline": true,
 "underlineColor": "#3E3D3B",
 "underlineColorNight": "#ADADAD",
 "underlineExtend": false,
 "underlineHeight": 1,
 "underlinePadding": 12
}

const Converter = (function () {
'use strict';

/* ------------------------------------------------------------------ 常量 */
var TD = new TextDecoder('utf-8');
var TE = new TextEncoder();
var RED_MAGIC = Uint8Array.of(0x52, 0x45, 0x44, 0x04);   // RED\x04

// Reeden 自己的默认夜间配色（App 对「没自定义夜间」的主题写出来的那份）
var REEDEN_DEFAULT_NIGHT = {
  primaryColor: '#FFFAFAFA', accentColor: '#FFFAFAFA', backgroundColor: '#FF000000',
  foregroundColor: '#FFFAFAFA', mutedForegroundColor: '#FFA1A1AA', cardColor: '#FF0C0C0C',
  cardForegroundColor: '#FFFAFAFA', popoverColor: '#FF09090B', mutedColor: '#FF27272A',
  borderColor: '#FF333333'
};
// Readingo 自己的默认夜间值：源主题的偶数槽位还等于这些，说明它压根没夜间
var READINGO_DEFAULT_NIGHT = {
  '6': '#4B9FFFFF', '8': '#0E1116FF', '14': '#161C25FF', '16': '#1C2430FF',
  '20': '#F2F5F9FF', '22': '#B4BECAFF', '28': '#243040FF', '30': '#314154FF',
  '38': '#4B9FFFFF'
};
// Readingo tab 槽位 -> Reeden navbar 槽位
var SLOT_MAP = { bookshelf: 'home', library: 'bookshelf', statistics: 'statistics', my: 'settings',
                 shelf: 'home', statistic: 'statistics', mine: 'settings' };
var PLACEHOLDER_SLOTS = ['notes', 'feature'];
var TIP_SLOTS = ['HeaderLeft', 'HeaderCenter', 'HeaderRight',
                 'FooterLeft', 'FooterCenter', 'FooterRight'];
// legado ReadTipType -> (Reeden item, 是否顺带开电池百分比)
var ANDROID_TIP = {
  0: ['none', false], 1: ['chapterName', false], 2: ['time', false], 3: ['battery', false],
  4: ['pageInBook', false], 5: ['pageInBookPercent', false], 6: ['pageInBookWithPercent', false],
  7: ['bookName', false], 8: ['batteryAndTime', false], 9: ['batteryAndTime', true],
  10: ['battery', true], 11: ['pageInBookPercent', false], 12: ['chapterName', false],
  13: ['battery', false], 14: ['battery', false], 15: ['battery', false],
  16: ['batteryAndTime', false], 17: ['chapterName', false], 18: ['custom', false],
  19: ['pageInBook', false], 20: ['pageInBookWithPercent', false]
};
var APPROX_TIP = { 4: '页码 → 全文進度頁碼', 5: '总进度 → 全文進度百分比',
                   6: '页码/总页数 → 全文頁碼及百分比', 9: '时间+电池+百分比 → 電量與時間＋電池顯示百分比',
                   10: '电池+百分比 → 電池電量＋電池顯示百分比' };
var TIP_ITEMS = ('none time chapterName bookName battery batteryAndTime pageInBook ' +
  'pageInBookPercent pageInBookWithPercent pageInChapter pageInChapterPercent ' +
  'pageInChapterWithPercent pageRemainingInChapter remainingChapters chapterRemainingTime ' +
  'bookRemainingTime todayReadingTime custom').split(' ');

// 阅读 nav 槽位 -> Reeden
var NAV_MAP = { home: 'home', bookshelf: 'bookshelf', explore: 'statistics', rss: 'notes', my: 'settings' };
// arc 底栏槽位 -> Reeden
var ARC_NAV_MAP = { bookshelf: 'bookshelf', discovery: 'home', rss: 'notes',
                    readRecord: 'statistics', my: 'settings' };
var ARC_CFG_USED = new Set(['themeName', 'isNightTheme', 'primaryColor', 'accentColor',
  'backgroundColor', 'cardColor', 'mutedColor', 'uiFontColor', 'titleFontColor', 'panelBorderColor',
  'panelBorderAlpha', 'searchFieldBackgroundColor', 'shelfColor',
  'backgroundImgPath', 'panelBackgroundImgPath']);

var TIP_TYPE = {}, TIP_PCT = new Set();
Object.keys(ANDROID_TIP).forEach(function (k) {
  TIP_TYPE[k] = ANDROID_TIP[k][0];
  if (ANDROID_TIP[k][1]) TIP_PCT.add(Number(k));
});
// 阅读 拼 *Middle，Reeden 拼 *Center
var TIP_KEYS = [['HeaderLeft', 'HeaderLeft'], ['HeaderMiddle', 'HeaderCenter'], ['HeaderRight', 'HeaderRight'],
                ['FooterLeft', 'FooterLeft'], ['FooterMiddle', 'FooterCenter'], ['FooterRight', 'FooterRight']];
var TOKEN_MAP = { '{Time}': '{time}', '{BookName}': '{book}', '{ChapterTitle}': '{chapter}',
  '{BatteryPercent}': '{batteryNumber}', '{PageIndex}': '{page}', '{PageSize}': '{total}',
  '{FullPageSize}': '{total}', '{FullPageIndex}': '{page}' };
var NIGHT_KEYS = ['themeColorNight', 'secondaryThemeColorNight', 'themeBackgroundColorNight',
                  'primaryTextColorNight', 'secondaryTextColorNight', 'labelContainerColorNight'];

// red -> 阅读（反向表）
var NAV_INV = { home: 'home', bookshelf: 'bookshelf', statistics: 'explore', notes: 'rss', settings: 'my' };
var NAV_ENTRY = { home: 'home', bookshelf: 'bookshelf', explore: 'explore', rss: 'rss', my: 'my' };
var TIP_INV = {}, TIP_AMBIGUOUS = {};
(function () {
  var byName = {};
  Object.keys(ANDROID_TIP).forEach(function (k) {
    var n = ANDROID_TIP[k][0];
    (byName[n] = byName[n] || []).push(Number(k));
  });
  Object.keys(byName).forEach(function (n) {
    TIP_INV[n] = Math.min.apply(null, byName[n]);
    TIP_AMBIGUOUS[n] = byName[n].slice().sort(function (a, b) { return a - b; });
  });
})();
/* ---------------------------------------------- 高级设置：四项排版数值
   只影响导出文件里的这四个 layoutConfig 键；不传就完全保持源里的数值（Python 版同一条路）。
   数值范围在这里夹一次，越界不会进产物。 */
var LAYOUT_LIM = { lineSpacing: [0, 500], paragraphSpacing: [0, 500], fontSize: [4, 500], letterSpacing: [-10, 50] };
var LAYOUT_DEFAULTS = { lineSpacing: 10, paragraphSpacing: 7, fontSize: 16, letterSpacing: 0.1 };
var LAYOUT_STORE_KEY = 'themeConverter.layout.v1';
var CURRENT_LAYOUT = null;   // ponytail: 单页单线程、转换串行，全局够用；真并发再改成传参
function sanitizeLayout(o) {
  var out = {};
  if (!o) return null;
  Object.keys(LAYOUT_LIM).forEach(function (k) {
    var v = parseFloat(o[k]);
    if (!isFinite(v)) return;
    out[k] = Math.round(Math.min(LAYOUT_LIM[k][1], Math.max(LAYOUT_LIM[k][0], v)) * 1000) / 1000;
  });
  return Object.keys(out).length ? out : null;
}
function sanitizeExportName(v) {
  if (typeof v !== 'string') return '';
  var s = v.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/\.(red|zip)$/i, '').trim();
  return s.slice(0, 60);
}
function applyLayout(lc) {
  if (!CURRENT_LAYOUT) return lc;
  Object.keys(CURRENT_LAYOUT).forEach(function (k) { lc[k] = CURRENT_LAYOUT[k]; });
  return lc;
}

var TOKEN_INV = { '{time}': '{Time}', '{book}': '{BookName}', '{chapter}': '{ChapterTitle}',
  '{batteryNumber}': '{BatteryPercent}', '{page}': '{PageIndex}', '{total}': '{PageSize}' };
var LAYOUT_INV = { fontSize: 'textSize', lineSpacing: 'lineSpacingExtra',
  paragraphSpacing: 'paragraphSpacing', letterSpacing: 'letterSpacing',
  paddingLeft: 'paddingLeft', paddingRight: 'paddingRight',
  headerPaddingTop: 'headerPaddingTop', headerPaddingBottom: 'headerPaddingBottom',
  headerPaddingLeft: 'headerPaddingLeft', headerPaddingRight: 'headerPaddingRight',
  footerPaddingTop: 'footerPaddingTop', footerPaddingBottom: 'footerPaddingBottom',
  footerPaddingLeft: 'footerPaddingLeft', footerPaddingRight: 'footerPaddingRight',
  contentPaddingTop: 'paddingTop', contentPaddingBottom: 'paddingBottom',
  titleMarginTop: 'titleTopSpacing', titlePaddingBottom: 'titleBottomSpacing',
  statusBarFontSize: 'headerFontSize', footerStatusBarFontSize: 'footerFontSize' };
var PALETTE_INV = { primaryColor: ['themeColor', 'themeColorNight'],
  accentColor: ['secondaryThemeColor', 'secondaryThemeColorNight'],
  backgroundColor: ['themeBackgroundColor', 'themeBackgroundColorNight'],
  foregroundColor: ['primaryTextColor', 'primaryTextColorNight'],
  mutedForegroundColor: ['secondaryTextColor', 'secondaryTextColorNight'],
  cardColor: ['labelContainerColor', 'labelContainerColorNight'],
  mutedColor: ['bookshelfCardColor', 'bookshelfCardColorDark'],
  borderColor: ['baseCardBorderColor', 'baseCardBorderColorNight'] };

// red -> arc
var NAV_RED = { bookshelf: 'bookshelf', home: 'discovery', notes: 'rss',
                statistics: 'readRecord', settings: 'my' };
var NAV_UNUSED = ['feature'];
var ARC_PALETTE = { primaryColor: 'primaryColor', accentColor: 'accentColor',
  backgroundColor: 'backgroundColor', cardColor: 'cardColor', mutedColor: 'mutedColor',
  searchFieldBackgroundColor: 'searchFieldBackgroundColor', shelfColor: 'shelfColor',
  foregroundColor: 'uiFontColor', cardForegroundColor: 'titleFontColor' };
var ARC_NO_SLOT = { popoverColor: '浮层底色', dialogBackgroundColor: '弹窗底色',
  dividerColor: '分割线色', mutedForegroundColor: '次要文字色', backgroundImageFit: '背景图填充方式',
  backgroundImageOpacity: '背景图不透明度', cardBackgroundBlur: '卡片背景模糊',
  themeEffectType: '主题效果', tabBackgroundColor: '标签栏底色', inputBackgroundColor: '输入框底色',
  inputBorderColor: '输入框描边', switchBorder: '开关描边', cardRadius: '卡片圆角',
  customSplashId: '启动图', bookshelfCarouselImageUrls: '书架头图', author: '作者署名',
  description: '主题说明' };


/* ------------------------------------------------------------------ 字节 */
function startsWith(b, arr) {
  if (b.length < arr.length) return false;
  for (var i = 0; i < arr.length; i++) if (b[i] !== arr[i]) return false;
  return true;
}
function concatBytes(list) {
  var n = 0, i;
  for (i = 0; i < list.length; i++) n += list[i].length;
  var out = new Uint8Array(n), o = 0;
  for (i = 0; i < list.length; i++) { out.set(list[i], o); o += list[i].length; }
  return out;
}
function jsonBytes(obj, pretty) {
  return TE.encode(pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj));
}
function J(bytes) { return JSON.parse(TD.decode(bytes)); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function isPlainObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function extname(p) { var i = String(p).lastIndexOf('.'); return i <= 0 ? '' : String(p).slice(i); }
function basename(p) { return String(p).split('/').pop(); }
// ponytail: 排序只用默认的 UTF-16 码位比较，等价于 Python 的码点排序（本项目全是 BMP 字符）
function pySorted(a) { return a.slice().sort(); }

/* ------------------------------------------------------------------ MD5 */
var MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
var MD5_K = [];
for (var _i = 0; _i < 64; _i++) MD5_K[_i] = (Math.floor(Math.abs(Math.sin(_i + 1)) * 4294967296)) >>> 0;

function md5Hex(u8) {
  var n = u8.length, bl = n * 8;
  var buf = new Uint8Array((((n + 8) >> 6) + 1) * 64);
  buf.set(u8);
  buf[n] = 0x80;
  var dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, bl >>> 0, true);
  dv.setUint32(buf.length - 4, Math.floor(bl / 4294967296), true);
  var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  var M = new Uint32Array(16);
  for (var off = 0; off < buf.length; off += 64) {
    for (var i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    var A = a0, B = b0, C = c0, D = d0;
    for (var k = 0; k < 64; k++) {
      var F, g;
      if (k < 16) { F = (B & C) | (~B & D); g = k; }
      else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) % 16; }
      else if (k < 48) { F = B ^ C ^ D; g = (3 * k + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * k) % 16; }
      F = (F + A + MD5_K[k] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + (((F << MD5_S[k]) | (F >>> (32 - MD5_S[k]))) >>> 0)) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  var out = new Uint8Array(16), odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true); odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
  var s = '';
  for (var j = 0; j < 16; j++) s += out[j].toString(16).padStart(2, '0');
  return s.toUpperCase();
}

/* ------------------------------------------------------------------ CRC32 */
var CRC_TABLE = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u8) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ------------------------------------------------------------------ deflate */
async function streamAll(readable) { return new Uint8Array(await new Response(readable).arrayBuffer()); }
async function inflateRaw(u8) {
  var ds = new DecompressionStream('deflate-raw');
  var w = ds.writable.getWriter(); w.write(u8); w.close();
  return streamAll(ds.readable);
}
async function deflateRaw(u8) {
  var cs = new CompressionStream('deflate-raw');
  var w = cs.writable.getWriter(); w.write(u8); w.close();
  return streamAll(cs.readable);
}
async function deflateZlib(u8) {
  var cs = new CompressionStream('deflate');
  var w = cs.writable.getWriter(); w.write(u8); w.close();
  return streamAll(cs.readable);
}

/* ------------------------------------------------------------------ zip 读 */
// 只解中央目录（不 inflate），给 detect 用
function zipNames(u8) {
  var eocd = -1;
  for (var i = u8.length - 22; i >= 0 && i >= u8.length - 22 - 0xFFFF; i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4B && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
  var names = [];
  for (var e = 0; e < count; e++) {
    var nlen = dv.getUint16(off + 28, true);
    var elen = dv.getUint16(off + 30, true);
    var clen = dv.getUint16(off + 32, true);
    names.push(TD.decode(u8.subarray(off + 46, off + 46 + nlen)));
    off += 46 + nlen + elen + clen;
  }
  return names;
}
async function unzip(u8) {
  var eocd = -1;
  for (var i = u8.length - 22; i >= 0 && i >= u8.length - 22 - 0xFFFF; i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4B && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 zip 文件');
  var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
  var out = new Map();
  for (var e = 0; e < count; e++) {
    var method = dv.getUint16(off + 10, true);
    var csize = dv.getUint32(off + 20, true);
    var nlen = dv.getUint16(off + 28, true);
    var elen = dv.getUint16(off + 30, true);
    var clen = dv.getUint16(off + 32, true);
    var lho = dv.getUint32(off + 42, true);
    var name = TD.decode(u8.subarray(off + 46, off + 46 + nlen));
    var lnlen = dv.getUint16(lho + 26, true);
    var lelen = dv.getUint16(lho + 28, true);
    var start = lho + 30 + lnlen + lelen;
    var raw = u8.subarray(start, start + csize);
    var data;
    if (method === 0) data = raw.slice();
    else if (method === 8) data = await inflateRaw(raw);
    else throw new Error('这个 zip 用了不支持的压缩方式（method ' + method + '）');
    out.set(name, data);
    off += 46 + nlen + elen + clen;
  }
  return out;
}

/* ------------------------------------------------------------------ zip 写 */
// 与 Python zipfile 同形：固定时间戳 1980-01-01、无目录条目、非 ASCII 名带 UTF-8 标志位
async function zipBytes(files) {
  var names = pySorted(Array.from(files.keys()));
  var locals = [], centrals = [], offset = 0;
  for (var i = 0; i < names.length; i++) {
    var name = names[i], data = files.get(name);
    var comp = await deflateRaw(data);
    var crc = crc32(data);
    var nb = TE.encode(name);
    var flag = /^[\x00-\x7F]*$/.test(name) ? 0 : 0x800;
    var lh = new Uint8Array(30 + nb.length), ldv = new DataView(lh.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, flag, true);
    ldv.setUint16(8, 8, true);
    ldv.setUint16(10, 0, true);
    ldv.setUint16(12, 0x21, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, comp.length, true);
    ldv.setUint32(22, data.length, true);
    ldv.setUint16(26, nb.length, true);
    ldv.setUint16(28, 0, true);
    lh.set(nb, 30);
    locals.push(lh, comp);

    var ch = new Uint8Array(46 + nb.length), cdv = new DataView(ch.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 0x0314, true);            // made by unix, version 20
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, flag, true);
    cdv.setUint16(10, 8, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0x21, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, comp.length, true);
    cdv.setUint32(24, data.length, true);
    cdv.setUint16(28, nb.length, true);
    cdv.setUint32(38, 0o100644 << 16, true);   // external attr
    cdv.setUint32(42, offset, true);
    ch.set(nb, 46);
    centrals.push(ch);
    offset += lh.length + comp.length;
  }
  var central = concatBytes(centrals);
  var eocd = new Uint8Array(22), edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, names.length, true);
  edv.setUint16(10, names.length, true);
  edv.setUint32(12, central.length, true);
  edv.setUint32(16, offset, true);
  return concatBytes(locals.concat([central, eocd]));
}

/* ------------------------------------------------------------------ 颜色 */
function argb(s, alpha) {
  alpha = alpha || 'FF';
  s = String(s == null ? '' : s).replace(/^#+/, '').toUpperCase();
  var rgb, a;
  if (s.length === 8) { rgb = s.slice(0, 6); a = s.slice(6); }
  else if (s.length === 6) { rgb = s; a = alpha; }
  else throw new Error('颜色值无法识别：' + s);
  return '#' + a + rgb;
}
function colorIntToArgb(v) { return '#' + (v >>> 0).toString(16).padStart(8, '0').toUpperCase(); }
function flatColor(v, fallback) {
  if (typeof v === 'string' && v.replace(/^#+/, '').replace(/#+$/, '')) {
    var s = v.replace(/^#+/, '').toUpperCase();
    return '#' + (s.length === 6 ? 'FF' + s : s);
  }
  if (typeof v === 'number' && v) return colorIntToArgb(v);
  return fallback;
}
function toNum(v) {
  if (typeof v === 'number') return v;
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/* --------------------------------------------------- Readingo 布局映射 */
function layoutFromReadingo(cfg) {
  var out = {};
  function put(dst) {
    for (var i = 1; i < arguments.length; i++) {
      var v = cfg[arguments[i]];
      if (v === undefined || v === null || typeof v === 'boolean') continue;
      var n = (typeof v === 'string' && v.trim()) ? toNum(v) : (typeof v === 'number' ? v : null);
      if (n !== null) { out[dst] = n; return; }
    }
  }
  put('fontSize', 'fontSize', 'bodyFontSize');
  put('lineSpacing', 'linePadding', 'themeLineSpacing');
  put('paragraphSpacing', 'paraPadding', 'themeParagraphSpacing');
  put('letterSpacing', 'charSpace', 'themeWordSpacing');
  put('paddingLeft', 'leftPadding', 'themePaddingLeft');
  put('paddingRight', 'rightPadding', 'themePaddingRight');
  put('headerPaddingTop', 'headerOffset', 'themeHeaderPaddingTop');
  put('headerPaddingLeft', 'headerPaddingLeft', 'themeHeaderPaddingLeft');
  put('headerPaddingRight', 'headerPaddingRight', 'themeHeaderPaddingRight');
  put('footerPaddingBottom', 'footerOffset', 'themeFooterPaddingBottom');
  put('footerPaddingLeft', 'footerPaddingLeft', 'themeFooterPaddingLeft');
  put('footerPaddingRight', 'footerPaddingRight', 'themeFooterPaddingRight');
  put('contentPaddingTop', 'topPadding', 'themePaddingTop');
  put('contentPaddingBottom', 'bottomPadding', 'themePaddingBottom');
  put('titlePaddingBottom', 'themeChapterTitleSpacing', 'titleTopSpacing');
  put('statusBarFontSize', 'headerFontSize');
  var hfs = cfg.headerFontSize, ffs = cfg.footerFontSize;
  if (typeof ffs === 'number' && typeof hfs === 'number' && ffs !== hfs) out.footerStatusBarFontSize = ffs;
  [['contentAlign', 'contentAlign', 'bodyAlignment'],
   ['titleAlign', 'titleAlign', 'chapterTitleAlignment'],
   ['paragraphIndent', 'paragraphIndent'],
   ['writingMode', 'writingMode']].forEach(function (spec) {
    for (var i = 1; i < spec.length; i++) {
      if (cfg[spec[i]]) { out[spec[0]] = cfg[spec[i]]; break; }
    }
  });
  var body = cfg.fontSize !== undefined ? cfg.fontSize : cfg.bodyFontSize;
  var title = cfg.chapterTitleFontSize !== undefined ? cfg.chapterTitleFontSize : cfg.titleSize;
  if (typeof title === 'number' && typeof body === 'number') out.titleFontSizeDiff = title - body;
  return out;
}

/* --------------------------------------------------- legado 布局映射 */
function isNumishStr(v) { return typeof v === 'string' && /^-?\d*\.?\d+$/.test(v.trim()); }
function layoutFromReadconfig(rc) {
  var out = {};
  function put(dst, src) {
    var v = rc[src];
    if (v === undefined || v === null || v === '' || typeof v === 'boolean') return;
    var n = typeof v === 'number' ? v : (isNumishStr(v) ? parseFloat(v) : null);
    if (n !== null) out[dst] = n;
  }
  put('fontSize', 'textSize');
  put('lineSpacing', 'lineSpacingExtra');
  put('paragraphSpacing', 'paragraphSpacing');
  put('letterSpacing', 'letterSpacing');
  put('paddingLeft', 'paddingLeft');
  put('paddingRight', 'paddingRight');
  put('headerPaddingTop', 'headerPaddingTop');
  put('headerPaddingBottom', 'headerPaddingBottom');
  put('headerPaddingLeft', 'headerPaddingLeft');
  put('headerPaddingRight', 'headerPaddingRight');
  put('footerPaddingTop', 'footerPaddingTop');
  put('footerPaddingBottom', 'footerPaddingBottom');
  put('footerPaddingLeft', 'footerPaddingLeft');
  put('footerPaddingRight', 'footerPaddingRight');
  put('contentPaddingTop', 'paddingTop');
  put('contentPaddingBottom', 'paddingBottom');
  put('titleMarginTop', 'titleTopSpacing');
  put('titlePaddingBottom', 'titleBottomSpacing');
  put('statusBarFontSize', 'headerFontSize');
  put('footerStatusBarFontSize', 'footerFontSize');
  var ts = rc.titleSize, bs = rc.textSize;
  if (typeof ts === 'number' && typeof bs === 'number' && ts > 0 && bs > 0 && ts - bs >= 0) {
    out.titleFontSizeDiff = ts - bs;
  }
  [['contentAlign', 'contentAlign'], ['titleAlign', 'titleAlign'], ['writingMode', 'writingMode']]
    .forEach(function (p) { if (rc[p[1]]) out[p[0]] = rc[p[1]]; });
  return out;
}
function translateTokens(text) {
  var unknown = [];
  (String(text).match(/\{[A-Za-z]+\}/g) || []).forEach(function (t) {
    if (!TOKEN_MAP[t] && unknown.indexOf(t) < 0) unknown.push(t);
  });
  var out = String(text);
  Object.keys(TOKEN_MAP).forEach(function (k) { out = out.split(k).join(TOKEN_MAP[k]); });
  return { text: out, unknown: unknown };
}
function headerFooter(rc, lc, unmappedTips, dropped) {
  TIP_KEYS.forEach(function (pair) {
    var srcKey = pair[0], dstKey = pair[1];
    var tip = rc['tip' + srcKey] || 0;
    var value = TIP_TYPE[tip];
    if (value === undefined) { unmappedTips.push('tip' + srcKey + '=' + tip); return; }
    if (value === 'custom') {
      var tr = translateTokens(rc['customTip' + srcKey] || '');
      if (tr.unknown.length) {
        dropped.push('页眉/页脚自定义文案 ' + srcKey + '（含 Reeden 不认识的占位符 '
          + tr.unknown.slice().sort().join('、') + '）');
        value = 'none'; tr.text = '';
      }
      if (!tr.text.trim()) value = 'none';
      lc['customTemplate' + dstKey] = tr.text;
    } else {
      lc['customTemplate' + dstKey] = '';
    }
    lc['statusItemType' + dstKey] = value;
    if (TIP_PCT.has(Number(tip))) lc.showBatteryPercent = true;
    if (APPROX_TIP[tip]) {
      dropped.push('页眉/页脚 ' + srcKey + '：' + APPROX_TIP[tip] + '（语义接近但不是同一项，装上后核一眼）');
    }
  });
}

/* --------------------------------------------------- 阅读排版包 -> reader_schema */
async function readerSchemas(zp, name, pid, light, dark, add, dropped, unmappedTips) {
  var rc = J(zp.get('readConfig.json'));
  var rid = 'reader_' + pid;
  function col(v, fallback) {
    var n = null;
    if (typeof v === 'string' && v.charAt(0) === '#') {
      var h = v.slice(1);
      n = (parseInt(h, 16) | (h.length <= 6 ? 0xFF000000 : 0)) >>> 0;
    } else if (typeof v === 'number') {
      n = v >>> 0;
    }
    if (!n) n = fallback >>> 0;       // 阅读的 0 = 未设置 -> 用调用方给的兜底色
    return colorIntToArgb(n);
  }
  var text = parseInt(String(light.foregroundColor || '#FF1C1B1F').replace(/^#/, ''), 16) >>> 0;
  var lc = clone(REFERENCE_LAYOUT);
  Object.assign(lc, layoutFromReadconfig(rc));
  headerFooter(rc, lc, unmappedTips, dropped);
  applyLayout(lc);
  if (rc.paragraphIndent) {
    dropped.push('首行缩进「' + rc.paragraphIndent + '」（阅读存的是缩进字符，Reeden 是枚举，没确认对应）');
  }
  var schema = {
    name: name + ' 排版',
    backgroundColor: light.backgroundColor,
    textColor: col(rc.textColor, text),
    primaryColor: light.primaryColor,
    headerStatusBarFontColor: col(rc.tipHeaderColor, text),
    footerStatusBarFontColor: col(rc.tipFooterColor, text),
    statusBarFontColorMode: 0,
    layoutConfig: JSON.stringify(lc)
  };
  var bgName = Number(rc.bgType || 0) === 2 ? rc.bgStr : null;
  if (bgName && zp.has(bgName)) {
    var blob = zp.get(bgName);
    add('reader_schema/' + rid + '/bg.img', blob);
    Object.assign(schema, { backgroundImageUrl: md5Hex(blob), backgroundImageOpacity: 1.0,
      backgroundImageFit: 'fill', backgroundImageBlur: 0.0 });
  } else if (bgName || Number(rc.bgTypeNight || 0) === 2) {
    dropped.push('阅读背景图（排版包里找不到该文件）');
  }
  if (rc.highlightRules && rc.highlightRules.length) {
    dropped.push('高亮规则 ' + rc.highlightRules.length + ' 条（Reeden 单个 .red 无对应槽位）');
  }
  add('reader_schema/' + rid + '/schema.json', jsonBytes(schema, true));
  light.readerColorSchemaId = rid;

  if (rc.textColorNight || Number(rc.bgTypeNight || 0) === 2) {
    var ridn = 'reader_' + pid + 'd';
    dark.readerColorSchemaId = ridn;
    var ntext = col(rc.textColorNight, parseInt(String(dark.foregroundColor).replace(/^#/, ''), 16) >>> 0);
    var ntextArgb = parseInt(ntext.replace(/^#/, ''), 16) >>> 0;
    var night = {
      name: name + ' 排版 夜间',
      backgroundColor: col(rc.bgStrNight, parseInt(String(dark.backgroundColor).replace(/^#/, ''), 16) >>> 0),
      textColor: ntext,
      primaryColor: dark.primaryColor,
      headerStatusBarFontColor: col(rc.tipHeaderColorNight, ntextArgb),
      footerStatusBarFontColor: col(rc.tipFooterColorNight, ntextArgb),
      statusBarFontColorMode: 0,
      layoutConfig: JSON.stringify(lc)
    };
    var nbg = Number(rc.bgTypeNight || 0) === 2 ? rc.bgStrNight : null;
    if (nbg && zp.has(nbg)) {
      var nblob = zp.get(nbg);
      add('reader_schema/' + ridn + '/bg.img', nblob);
      Object.assign(night, { backgroundImageUrl: md5Hex(nblob), backgroundImageOpacity: 1.0,
        backgroundImageFit: 'fill', backgroundImageBlur: 0.0 });
    } else if (nbg) {
      dropped.push('阅读夜间背景图（排版包里找不到该文件）');
    }
    add('reader_schema/' + ridn + '/schema.json', jsonBytes(night, true));
  }
}

/* ------------------------------------------------------------------ 占位图标 */
// 与 readingo_to_red.placeholder_icon 同形：112×112 RGBA、品牌色实心圆点，filter 0 单 IDAT。
// ponytail: 压缩级别由浏览器的 CompressionStream 决定（Python 用 zlib level 9），
// 像素完全一致、压缩后的字节不同；升级路径是自己实现 zlib level 9 的 deflate。
function placeholderIcon(argbHex, size) {
  size = size || 112;
  var r = parseInt(argbHex.slice(3, 5), 16), g = parseInt(argbHex.slice(5, 7), 16),
      b = parseInt(argbHex.slice(7, 9), 16);
  var c = (size - 1) / 2, radius = size * 0.25;
  var raw = new Uint8Array(size * (size * 4 + 1)), o = 0;
  for (var y = 0; y < size; y++) {
    raw[o++] = 0;
    for (var x = 0; x < size; x++) {
      var inside = (x - c) * (x - c) + (y - c) * (y - c) <= radius * radius;
      raw[o++] = inside ? r : 0; raw[o++] = inside ? g : 0;
      raw[o++] = inside ? b : 0; raw[o++] = inside ? 255 : 0;
    }
  }
  return pngFromRaw(raw, size, size).then(function (idat) {
    var ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
    dv.setUint32(0, size, false); dv.setUint32(4, size, false);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    return concatBytes([Uint8Array.of(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A),
      pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', new Uint8Array(0))]);
  });
}
async function pngFromRaw(raw, w, h) {
  void w; void h;
  return deflateZlib(raw);   // zlib.compress(raw, 9) 的对应物
}
function pngChunk(tag, data) {
  var tagBytes = TE.encode(tag);
  var body = concatBytes([tagBytes, data]);
  var out = new Uint8Array(4 + body.length + 4), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length, false);
  out.set(body, 4);
  dv.setUint32(4 + body.length, crc32(body), false);
  return out;
}
// SVG -> 透明 PNG（Readingo 安卓味底栏图标可能是 svg，先按需转）
async function rasterizeSvg(svgBytes, size) {
  size = size || 112;
  var url = URL.createObjectURL(new Blob([svgBytes], { type: 'image/svg+xml' }));
  try {
    var img = await new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = function () { rej(new Error('svg 解码失败')); };
      i.src = url;
    });
    var cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/png'); });
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

/* ------------------------------------------------------------------ RGSHARE2 */
var BUILTIN_KEY_MATERIAL = 'Readingo.ThemeShare2.BuiltinKey.v1.20260607';
var BUILTIN_INFO = 'theme-share2';
function splitRgshare2(raw) {
  var start = -1;
  for (var i = 0; i < raw.length; i++) if (raw[i] === 0x7B) { start = i; break; }   // '{'
  if (start < 0) throw new Error('RGSHARE2 头部损坏');
  var depth = 0, inStr = false, esc = false;
  for (var j = start; j < raw.length; j++) {
    var c = raw[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === 0x5C) esc = true;
      else if (c === 0x22) inStr = false;
      continue;
    }
    if (c === 0x22) inStr = true;
    else if (c === 0x7B) depth++;
    else if (c === 0x7D) { depth--; if (depth === 0) {
      var header = JSON.parse(TD.decode(raw.subarray(start, j + 1)));
      return { header: header, body: raw.subarray(j + 1) };
    } }
  }
  throw new Error('RGSHARE2 头部损坏');
}
async function decryptRgshare2(raw) {
  var sp = splitRgshare2(raw);
  var enc = sp.header.encryption || {};
  if (enc.keyDerivation !== 'builtin-v1') throw new Error('不支持的 keyDerivation：' + enc.keyDerivation);
  if (enc.passwordProtected) throw new Error('这是带密码的 Readingo 分享，需要密码才能解开');
  var rawKey = await crypto.subtle.importKey('raw', TE.encode(BUILTIN_KEY_MATERIAL), 'HKDF', false, ['deriveBits']);
  var bits = await crypto.subtle.deriveBits({
    name: 'HKDF', hash: 'SHA-256',
    salt: base64ToBytes(enc.salt), info: TE.encode(BUILTIN_INFO)
  }, rawKey, 256);
  var key = await crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['decrypt']);
  var body = sp.body;
  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(enc.nonce), tagLength: 128 },
    key, body));
}
function base64ToBytes(b64) {
  var bin = atob(b64), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ================================================================== 1) 源 → 内存 .red */
// 统一模型：{ name, theme, files(Map), schemas, dropped, notes }
function schemasFromFiles(files) {
  var schemas = {}, art = {};
  Array.from(files.keys()).forEach(function (n) {
    var padded = '/' + n;      // 与 red_to_legado.read_red 一致：允许条目被 `1/…` 包一层
    if (padded.indexOf('/reader_schema/') >= 0 && /schema\.json$/.test(n)) {
      var parts = n.split('/');
      schemas[parts[parts.length - 2]] = J(files.get(n));
    } else if (padded.indexOf('/reader_schema/') >= 0 && /bg\.img$/.test(n)) {
      var ps = n.split('/');
      art[ps[ps.length - 2]] = files.get(n);
    }
  });
  var out = {};
  Object.keys(schemas).forEach(function (rid) { out[rid] = { schema: schemas[rid], bg: art[rid] || null }; });
  return out;
}
function pidOf(name) {
  var p = String(name || '').replace(/[^A-Za-z0-9]+/g, '');
  if (p) return p;
  var bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  var s = '';
  for (var i = 0; i < 8; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s.slice(0, 11);
}

/* ------------------------------------------------- Readingo .rgshare → .red */
async function redFromReadingo(payload, dropped, notes) {
  var zp = await unzip(payload);
  var names = Array.from(zp.keys());
  var theme = J(zp.get('theme.json'));
  var apple = names.indexOf('android.json') < 0;
  var meta = {}, android = {}, cfg, bgPrefix;
  if (apple) {
    meta = J(zp.get('meta.json'));
    cfg = J(zp.get('resources/reader_theme/theme.json'));
    bgPrefix = 'images/';
  } else {
    android = J(zp.get('android.json'));
    cfg = J(zp.get(android.readerTheme.lightConfigPath));
    bgPrefix = '';
  }
  function blk() {
    for (var i = 0; i < arguments.length; i++) {
      var k = arguments[i];
      if (isPlainObj(android[k])) return android[k];
      if (isPlainObj(meta[k])) return meta[k];
    }
    return {};
  }
  var coverBlock = blk('coverLight', 'cover');
  var tabBlock = blk('tabBarProfileLight', 'tabBarProfile');
  var name = theme['1'] || 'Converted Theme';
  var b2 = theme['2'], lightCfg = (theme.androidExt || {}).light || {};
  var pid = pidOf(theme['0']);
  var coverId = 'cover_' + pid, navId = 'navbar_' + pid, readerId = 'reader_' + pid;

  function modeBlock(off) {
    function c(key, dflt) {
      var a = b2[String(key + off)];
      if (a !== undefined) return a;
      var b = b2[String(key)];
      return b !== undefined ? b : dflt;
    }
    return {
      primaryColor: argb(c(5)),
      accentColor: argb(c(37, c(5))),
      backgroundColor: argb(c(7)),
      foregroundColor: argb(c(19)),
      mutedForegroundColor: argb(c(21)),
      cardColor: argb(c(13)),
      cardForegroundColor: argb(c(19)),
      popoverColor: argb(c(7)),
      dialogBackgroundColor: argb(c(15)),
      mutedColor: argb(c(27, c(21))),
      borderColor: argb(c(29)),
      dividerColor: argb(c(27, c(29))),
      backgroundImageFit: 'fill',
      author: '',
      description: ''
    };
  }
  var light = modeBlock(0), dark = modeBlock(1);
  var radius = (lightCfg.shelfCard || {}).cardCornerRadiusDp;
  if (typeof radius === 'number') { light.cardRadius = radius; dark.cardRadius = radius; }
  if (Object.keys(READINGO_DEFAULT_NIGHT).every(function (k) { return b2[k] === READINGO_DEFAULT_NIGHT[k]; })) {
    var keep = {};
    ['author', 'description'].forEach(function (k) { if (k in dark) keep[k] = dark[k]; });
    dark = Object.assign(keep, REEDEN_DEFAULT_NIGHT);
  }
  [light, dark].forEach(function (m) {
    m.coverGalleryId = coverId; m.navbarPackId = navId; m.readerColorSchemaId = readerId;
  });

  var files = new Map();
  function add(rel, data) { files.set(rel, data); }

  // 应用背景
  [['45', 'light/theme_bg.img'], ['46', 'dark/theme_bg.img']].forEach(function (p) {
    var bgName = (theme['4'] || {})[p[0]];
    if (!bgName) return;
    var bgPath = bgPrefix + bgName;
    var blob = zp.has(bgPath) ? zp.get(bgPath) : (function () {
      var hit = null;
      names.forEach(function (n) { if (hit === null && n.endsWith(bgName)) hit = n; });
      return hit ? zp.get(hit) : null;
    })();
    if (!blob) { dropped.push('应用背景图 ' + bgName + '（包里找不到这个文件）'); return; }
    add(p[1], blob);
    (p[1].indexOf('light/') === 0 ? light : dark).backgroundImage = md5Hex(blob);
  });

  // 封面图集
  pySorted((coverBlock.files || []).slice()).forEach(function (f, i) {
    add('cover_gallery/' + coverId + '/' + (i + 1) + (extname(f).toLowerCase() || '.png'), zp.get(f));
  });
  add('cover_gallery/' + coverId + '/meta.json',
    jsonBytes({ name: name, transparentOptimization: true }));

  // 底栏包
  var tabFiles = pySorted((tabBlock.files || []).slice());
  for (var ti = 0; ti < tabFiles.length; ti++) {
    var f = tabFiles[ti];
    var stem = basename(f).replace(/\.[^.]*$/, '').toLowerCase();
    stem = stem.replace(/^icon_/, '');
    stem = stem.replace(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}_/, '');
    var slot, suffix;
    var match = ['_normal', '_selected'].find(function (s) { return stem.endsWith(s); });
    if (match) { suffix = match; slot = SLOT_MAP[stem.slice(0, -match.length)]; }
    else { suffix = '_normal'; slot = SLOT_MAP[stem]; }
    if (!slot) continue;
    var data = zp.get(f);
    if (/\.svg$/i.test(f)) {
      var png = null;
      try { png = await rasterizeSvg(data, 112); } catch (e) { png = null; }
      if (!png) { dropped.push('底栏图标 ' + basename(f) + '（svg 光栅化失败，这一格没搬）'); continue; }
      data = png;
    }
    add('navbar_pack/' + navId + '/' + slot + suffix + '.png', data);
  }
  for (var pi = 0; pi < PLACEHOLDER_SLOTS.length; pi++) {
    var pslot = PLACEHOLDER_SLOTS[pi];
    add('navbar_pack/' + navId + '/' + pslot + '_normal.png', await placeholderIcon(light.primaryColor));
  }
  add('navbar_pack/' + navId + '/meta.json',
    jsonBytes({ name: tabBlock.name || name, matchMode: 'byType' }));

  // 排版
  var lc = clone(REFERENCE_LAYOUT);
  Object.assign(lc, layoutFromReadingo(cfg));
  if (!apple) {
    [['headerLeft', 'HeaderLeft'], ['headerCenter', 'HeaderCenter'], ['headerRight', 'HeaderRight'],
     ['footerLeft', 'FooterLeft'], ['footerCenter', 'FooterCenter'], ['footerRight', 'FooterRight']]
      .forEach(function (p) {
        var tip = cfg[p[0]];
        if (tip === undefined || tip === null || typeof tip === 'boolean') return;
        var rec = ANDROID_TIP[tip];
        if (!rec) { dropped.push('页眉/页脚 ' + p[0] + '：阅读类型 ' + tip + '（未解出，保持基准）'); return; }
        var value = rec[0];
        if (value === 'custom') {
          var text = (cfg['customTip' + p[0].charAt(0).toUpperCase() + p[0].slice(1)] || '').trim();
          if (!text) {
            dropped.push('页眉/页脚 ' + p[0] + '：源里是自定义但没有文案，按无处理');
            value = 'none';
          } else { lc['customTemplate' + p[1]] = text; }
        }
        lc['statusItemType' + p[1]] = value;
        if (rec[1]) lc.showBatteryPercent = true;
        if (APPROX_TIP[tip]) {
          dropped.push('页眉/页脚 ' + p[0] + '：' + APPROX_TIP[tip] + '（语义接近但不是同一项，装上后核一眼）');
        }
      });
  }
  var darkCfg = null;
  if (!apple) {
    var dpath = (android.readerTheme || {}).darkConfigPath;
    if (dpath && zp.has(dpath)) darkCfg = J(zp.get(dpath));
  }
  var darkReaderId = 'reader_' + pid + 'd';
  function schemaFor(mcfg, rid, primary, fbBg, fbFg, cands) {
    var mlc = (mcfg === cfg) ? lc : Object.assign(clone(lc), layoutFromReadingo(mcfg));
    applyLayout(mlc);
    TIP_SLOTS.forEach(function (slot) {
      if (mlc['statusItemType' + slot] !== 'custom') mlc['customTemplate' + slot] = '';
    });
    var out = {
      name: mcfg.name || mcfg.title || name,
      backgroundColor: flatColor(mcfg.bgColor || mcfg.backgroundColor, fbBg),
      textColor: flatColor(mcfg.textColor, fbFg),
      primaryColor: primary,
      headerStatusBarFontColor: flatColor(mcfg.headerColor || mcfg.tipHeaderColor || mcfg.titleColor, fbFg),
      footerStatusBarFontColor: flatColor(mcfg.footerColor || mcfg.tipFooterColor || mcfg.textColor, fbFg),
      statusBarFontColorMode: 0,
      layoutConfig: JSON.stringify(mlc)
    };
    for (var i = 0; i < cands.length; i++) {
      var cand = cands[i];
      if (cand && zp.has(cand)) {
        var blob = zp.get(cand);
        add('reader_schema/' + rid + '/bg.img', blob);
        Object.assign(out, { backgroundImageUrl: md5Hex(blob), backgroundImageOpacity: 1.0,
          backgroundImageFit: 'fill', backgroundImageBlur: 0.0 });
        break;
      }
    }
    add('reader_schema/' + rid + '/schema.json', jsonBytes(out, true));
  }
  schemaFor(cfg, readerId, light.primaryColor, argb(b2['7']), colorIntToArgb(0xFF000000), [
    'android/reader/background_light.png', 'android/reader/background_light.jpg',
    cfg.backgroundImage ? 'resources/reader_theme/' + cfg.backgroundImage : null,
    cfg.bgName ? 'android/reader/' + cfg.bgName : null]);
  if (darkCfg) {
    schemaFor(darkCfg, darkReaderId, dark.primaryColor,
      argb(b2['8'] !== undefined ? b2['8'] : b2['7']),
      argb(b2['20'] !== undefined ? b2['20'] : b2['7']),
      ['android/reader/background_dark.png', 'android/reader/background_dark.jpg',
       'android/reader/background_dark.jpeg',
       darkCfg.bgName ? 'android/reader/' + darkCfg.bgName : null]);
    dark.readerColorSchemaId = darkReaderId;
  }

  // 书架头图
  [['light', ['shelfHeaderImageLight', 'shelfHeaderImage']], ['dark', ['shelfHeaderImageDark']]]
    .forEach(function (p) {
      var blkObj = blk.apply(null, p[1]);
      var list = (blkObj.files || (blkObj.filePath ? [blkObj.filePath] : [])).slice();
      var blobs = pySorted(list).map(function (f) { return zp.get(f); });
      if (!blobs.length) return;
      var manifest = [];
      blobs.forEach(function (blob, i) {
        var fn = String(i).padStart(3, '0') + '.img';
        add(p[0] + '/bookshelf_carousel/' + fn, blob);
        manifest.push({ url: md5Hex(blob), file: fn });
      });
      add(p[0] + '/bookshelf_carousel/manifest.json',
        jsonBytes(manifest));
      (p[0] === 'light' ? light : dark).bookshelfCarouselImageUrls =
        manifest.map(function (m) { return m.url; });
    });
  // 卡片背景
  ['android/shelf_card/light.png', 'android/shelf_card/light.jpg'].some(function (cand) {
    if (!zp.has(cand)) return false;
    var blob = zp.get(cand);
    add('light/card_bg.img', blob);
    light.cardBackgroundImage = md5Hex(blob);
    return true;
  });
  if (apple) {
    ((meta.readerTheme || {}).fonts || []).forEach(function (fnt) {
      dropped.push('阅读器字体 ' + (fnt.name || fnt.fileName) + '（Reeden 的 .red 没有字体槽位）');
    });
  }
  add('theme.json', jsonBytes({ name: name, light: light, dark: dark }, true));
  return { name: name, theme: { name: name, light: light, dark: dark }, files: files };
}

/* ------------------------------------------------- 阅读 MD3 主题包 → .red */
async function redFromMd3(themeZip, paibanZip, dropped, notes) {
  var zt = await unzip(themeZip);
  if (zt.has('appearance_kit.json')) return redFromArcKit(themeZip, paibanZip, dropped, notes);
  var man = J(zt.get('manifest.json'));
  var cfg = man.config || {};
  if (man.formatVersion !== 1) throw new Error('阅读主题包版本不支持：' + man.formatVersion);
  var name = man.name || 'Converted Theme';
  var pid = pidOf(man.name);
  var light = palette(cfg, false);
  dropped.push('卡片背景/弹窗/菜单底色统一取辅助背景色、卡片圆角留「跟随全局」（阅读 MD3 没有「卡片」概念）');
  var hasNight = NIGHT_KEYS.some(function (k) { return typeof cfg[k] === 'number' && cfg[k]; });
  var dark;
  if (hasNight) dark = palette(cfg, true);
  else {
    dark = {};
    ['author', 'description'].forEach(function (k) { if (k in light) dark[k] = light[k]; });
    Object.assign(dark, REEDEN_DEFAULT_NIGHT);
  }
  var files = new Map();
  function add(rel, data) { files.set(rel, data); }
  function assetBytes(key) {
    var p = (man.assets || {})[key];
    return (p && zt.has(p)) ? zt.get(p) : null;
  }
  [['background.light', 'light/theme_bg.img', light], ['background.dark', 'dark/theme_bg.img', dark]]
    .forEach(function (p) {
      var blob = assetBytes(p[0]);
      if (blob) { add(p[1], blob); p[2].backgroundImage = md5Hex(blob); }
    });
  [['light', 'light', light], ['dark', 'dark', dark]].forEach(function (g) {
    var imgs = [];
    (man.coverAlbums || []).forEach(function (a) {
      (a[g[0] + 'Images'] || []).forEach(function (i) {
        if (i.path && zt.has(i.path)) imgs.push([i.path, zt.get(i.path)]);
      });
    });
    if (!imgs.length) return;
    var gid = 'cover_' + pid + '_' + g[1];
    imgs.forEach(function (pair, i) {
      add('cover_gallery/' + gid + '/' + (i + 1) + (extname(pair[0]).toLowerCase() || '.png'), pair[1]);
    });
    add('cover_gallery/' + gid + '/meta.json', jsonBytes({ name: name, transparentOptimization: true }));
    g[2].coverGalleryId = gid;
  });
  var navId = 'navbar_' + pid, missing = [];
  Object.keys(NAV_MAP).forEach(function (srcSlot) {
    var dstSlot = NAV_MAP[srcSlot];
    var blob = assetBytes('navigation.' + srcSlot);
    if (!blob) { missing.push(dstSlot); return; }
    ['normal', 'selected'].forEach(function (state) {
      var art = state === 'normal' ? blob : (assetBytes('navigation.' + srcSlot + '.selected') || blob);
      add('navbar_pack/' + navId + '/' + dstSlot + '_' + state + '.png', art);
    });
  });
  add('navbar_pack/' + navId + '/meta.json', jsonBytes({ name: name, matchMode: 'byType' }));
  light.navbarPackId = navId;

  var unmappedTips = [];
  if (paibanZip) {
    await readerSchemas(await unzip(paibanZip), name, pid, light, dark, add, dropped, unmappedTips);
  } else {
    dropped.push('未提供 排版 zip：阅读排版/阅读主题未包含');
  }
  if (assetBytes('font.app')) dropped.push('应用字体 app.ttf（Reeden 的 .red 没有字体槽位）');
  var containers = ['container.large.light', 'container.large.dark', 'container.item.light',
                    'container.item.dark'].filter(function (k) { return assetBytes(k); });
  if (containers.length) {
    dropped.push('容器图 ' + containers.join('、') + '（源里带了，Reeden 只有一个卡片背景槽位，没确认对应哪张，未写）');
  }
  if (missing.length) {
    dropped.push('底栏图标槽 ' + Array.from(new Set(missing)).sort().join('、') + '（源里没有）');
  }
  if (unmappedTips.length) {
    dropped.push('页眉/页脚位置 ' + unmappedTips.join('、') + '（阅读的类型值在 Reeden 里没有确认的对应，保持默认）');
  }
  if (!hasNight) dropped.push('夜间配色（源里没有）：夜间用 App 默认夜间配色，不照抄日间色');
  add('theme.json', jsonBytes({ name: name, light: light, dark: dark }, true));
  return { name: name, theme: { name: name, light: light, dark: dark }, files: files };
}
function palette(cfg, night) {
  function g() {
    for (var i = 0; i < arguments.length; i++) {
      var v = cfg[arguments[i]];
      if (typeof v === 'number' && v !== 0 && (v & 0xFF000000)) return v;
    }
    return 0;
  }
  function argbInt(v, fallback) { return '#' + ((v || fallback) >>> 0).toString(16).padStart(8, '0').toUpperCase(); }
  var primary = argbInt(g(night ? 'themeColorNight' : 'themeColor', 'cPrimary'), 0xFF6750A4);
  var bg = argbInt(g(night ? 'themeBackgroundColorNight' : 'themeBackgroundColor'), 0xFFFEF7FF);
  var fg = argbInt(g(night ? 'primaryTextColorNight' : 'primaryTextColor'), 0xFF1C1B1F);
  var muted = argbInt(g(night ? 'secondaryTextColorNight' : 'secondaryTextColor'), 0xFF49454F);
  var card = argbInt(g(night ? 'labelContainerColorNight' : 'labelContainerColor'), 0xFFF7F2FA);
  var accent = argbInt(g(night ? 'secondaryThemeColorNight' : 'secondaryThemeColor'),
                       parseInt(primary.replace('#', ''), 16) >>> 0);
  var border = cfg[night ? 'baseCardBorderColorNight' : 'baseCardBorderColor'];
  if (typeof border === 'number') border = (border === 0 || !(border & 0xFF000000)) ? null : argbInt(border, 0);
  border = '#' + (night ? '2E' : '1F') + String(border || muted).replace(/^#/, '').slice(-6);
  // 阅读 MD3 没有「卡片」这个概念（她 2026-09-22）：卡片背景/弹窗/菜单底色统一取辅助背景色
  // （= 书架卡片色），卡片圆角不写出去，让 Reeden 保持「跟随全局」。
  var aux = argbInt(g(night ? 'bookshelfCardColorDark' : 'bookshelfCardColor'),
                    parseInt(card.replace('#', ''), 16) >>> 0);
  return {
    primaryColor: primary, accentColor: accent, backgroundColor: bg, foregroundColor: fg,
    mutedForegroundColor: muted, cardColor: aux, cardForegroundColor: fg, popoverColor: aux,
    dialogBackgroundColor: aux, mutedColor: aux,
    borderColor: border, dividerColor: border, backgroundImageFit: 'fill',
    author: '', description: ''
  };
}

/* ------------------------------------------------- arc 外观套件 → .red */
async function redFromArcKit(kitPath, paibanZip, dropped, notes) {
  var zk = await unzip(kitPath);
  var kit = J(zk.get('appearance_kit.json'));
  var comps = new Map();
  (kit.components || []).forEach(function (c) {
    var p = c.path;
    if (zk.has(p) && !comps.has(c.type + '|' + !!c.isNight)) comps.set(c.type + '|' + !!c.isNight, p);
  });
  var files = new Map();
  function add(rel, data) { files.set(rel, data); }
  function find(zi, leaf) {
    for (var n of zi.keys()) if (n === leaf || n.endsWith('/' + leaf)) return n;
    return null;
  }
  async function themeOf(isNight) {
    var path = comps.get('THEME|' + !!isNight);
    if (!path) return null;
    var zi = await unzip(zk.get(path));
    var tp = find(zi, 'theme.json');
    if (!tp) return null;
    return { zi: zi, pkg: J(zi.get(tp)), base: tp.indexOf('/') >= 0 ? tp.slice(0, tp.lastIndexOf('/') + 1) : '' };
  }
  var day = await themeOf(false);
  if (!day) throw new Error('外观套件里没有日间主题（THEME 组件）');
  var cfg = day.pkg.config || {};
  var name = day.pkg.name || kit.name || 'Converted Theme';
  var pid = pidOf(name);
  var light = arcPalette(cfg, dropped);
  var nightT = await themeOf(true);
  var hasNight = !!nightT;
  var dark = hasNight ? arcPalette(nightT.pkg.config || {}, dropped)
                      : Object.assign({}, REEDEN_DEFAULT_NIGHT, { author: '', description: '' });

  function shipBg(t, scfg, mode, block) {
    var rel = scfg.backgroundImgPath;
    if (!rel) return;
    var n = find(t.zi, rel);
    if (!n) { dropped.push(mode + ' 应用背景图（套件里找不到 ' + rel + '）'); return; }
    var blob = t.zi.get(n);
    add(mode + '/theme_bg.img', blob);
    block.backgroundImage = md5Hex(blob);
  }
  function shipCard(t, scfg, mode, block) {
    var rel = scfg.panelBackgroundImgPath;
    if (!rel) return;
    var n = find(t.zi, rel);
    if (!n) { dropped.push(mode + ' 面板背景图（套件里找不到 ' + rel + '）'); return; }
    var blob = t.zi.get(n);
    add(mode + '/card_bg.img', blob);
    block.cardBackgroundImage = md5Hex(blob);
  }
  shipBg(day, cfg, 'light', light);
  shipCard(day, cfg, 'light', light);
  if (hasNight) {
    shipBg(nightT, nightT.pkg.config || {}, 'dark', dark);
    shipCard(nightT, nightT.pkg.config || {}, 'dark', dark);
  } else {
    dropped.push('夜间配色（外观套件里没有夜间主题）：夜间用 App 默认夜间配色，不照抄日间色');
  }
  var navPath = comps.get('NAVIGATION_BAR|false') || comps.get('NAVIGATION_BAR|true');
  if (navPath) {
    var nzi = await unzip(zk.get(navPath));
    var njName = find(nzi, 'navigation.json');
    var icons = (J(nzi.get(njName)).icons) || {};
    var navId = 'navbar_' + pid;
    var nb = njName.indexOf('/') >= 0 ? njName.slice(0, njName.lastIndexOf('/') + 1) : '';
    var missing = [];
    Object.keys(ARC_NAV_MAP).forEach(function (srcSlot) {
      var dstSlot = ARC_NAV_MAP[srcSlot], got = false;
      ['normal', 'selected'].forEach(function (state) {
        var f = icons[srcSlot + '_' + state];
        if (!f || !find(nzi, f)) return;
        var entry = nzi.has(nb + f) ? nb + f : find(nzi, f);
        if (!entry) return;
        add('navbar_pack/' + navId + '/' + dstSlot + '_' + state + '.png', nzi.get(entry));
        got = true;
      });
      if (!got) missing.push(dstSlot);
    });
    add('navbar_pack/' + navId + '/meta.json', jsonBytes({ name: name, matchMode: 'byType' }));
    light.navbarPackId = navId;
    if (hasNight) dark.navbarPackId = navId;
    if (missing.length) dropped.push('底栏图标槽 ' + Array.from(new Set(missing)).sort().join('、') + '（arc 那边没有对应槽位）');
    if (comps.get('NAVIGATION_BAR|true')) dropped.push('夜间底栏图标（arc 单独一份，Reeden 一个包只有一套）');
    if (icons.search_single) dropped.push('悬浮搜索按钮图标 search_single（.red 无此槽位）');
  }
  async function shipGallery(isNight) {
    var path = comps.get('COVER_COLLECTION|' + !!isNight);
    if (!path) return null;
    var czi = await unzip(zk.get(path));
    var cname = find(czi, 'collection.json');
    var col = J(czi.get(cname));
    var cb = cname.indexOf('/') >= 0 ? cname.slice(0, cname.lastIndexOf('/') + 1) : '';
    var imgs = (col.images || []).filter(function (i) { return find(czi, i); });
    if (!imgs.length) return null;
    var gid = 'cover_' + pid + (isNight ? 'd' : '');
    imgs.forEach(function (rel, i) {
      var entry = czi.has(cb + rel) ? cb + rel : find(czi, rel);
      add('cover_gallery/' + gid + '/' + (i + 1) + (extname(rel).toLowerCase() || '.png'), czi.get(entry));
    });
    add('cover_gallery/' + gid + '/meta.json', jsonBytes({ name: name, transparentOptimization: true }));
    notes.push(imgs.length + ' 张封面图集（arc 的 ' + (isNight ? '夜间' : '日间') + '封面集，已按对应模式写）');
    return gid;
  }
  var gid = await shipGallery(false);
  if (gid) light.coverGalleryId = gid;
  var gidn = await shipGallery(true);
  if (gidn) dark.coverGalleryId = gidn;
  if (!gid && !gidn) dropped.push('封面图集（套件里没有 COVER_COLLECTION 组件）');
  [true, false].forEach(function (isNight) {
    if (comps.get('TOP_BAR|' + isNight)) {
      dropped.push((isNight ? '夜间' : '日间') + '顶栏 top_bar.json（.red 没有顶栏槽位）');
    }
  });
  var unmappedTips = [];
  if (paibanZip) {
    await readerSchemas(await unzip(paibanZip), name, pid, light, dark, add, dropped, unmappedTips);
  } else {
    dropped.push('未提供 排版 zip：阅读排版/阅读主题未包含');
  }
  if (unmappedTips.length) {
    dropped.push('页眉/页脚位置 ' + unmappedTips.join('、') + '（arc 的类型值在 Reeden 里没有确认的对应，保持默认）');
  }
  var extra = Object.keys(cfg).filter(function (k) { return !ARC_CFG_USED.has(k); }).sort();
  if (extra.length) dropped.push('arc 界面设置里 .red 没槽位的：' + extra.join('、'));
  if (!hasNight) {
    dark.coverGalleryId = light.coverGalleryId !== undefined ? light.coverGalleryId : dark.coverGalleryId;
    dark.navbarPackId = light.navbarPackId !== undefined ? light.navbarPackId : dark.navbarPackId;
  }
  add('theme.json', jsonBytes({ name: name, light: light, dark: dark }, true));
  return { name: name, theme: { name: name, light: light, dark: dark }, files: files };
}
function arcCol(v, fallback) {
  if (typeof v === 'number') v = v > 0 ? '#' + (v >>> 0).toString(16).padStart(8, '0').toUpperCase() : null;
  if (typeof v !== 'string' || v.charAt(0) !== '#') return fallback;
  var h = v.replace(/^#/, '');
  if (h.length === 6) h = 'FF' + h;
  return h.length === 8 ? '#' + h.slice(0, 8).toUpperCase() : fallback;
}
// Python round() 是四舍六入五取偶，这里对齐（只用在 panelBorderAlpha）
function pyRound(x) {
  var f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return (f % 2 === 0) ? f : f + 1;
}
function arcPalette(cfg, dropped) {
  var light = {};
  [['primaryColor', 'primaryColor'], ['accentColor', 'accentColor'],
   ['backgroundColor', 'backgroundColor'], ['mutedColor', 'mutedColor'],
   ['searchFieldBackgroundColor', 'searchFieldBackgroundColor'], ['shelfColor', 'shelfColor']]
    .forEach(function (p) {
      var v = arcCol(cfg[p[1]], null);
      if (v) light[p[0]] = v;
    });
  var fg = arcCol(cfg.uiFontColor, null);
  if (fg) {
    light.foregroundColor = fg;
    light.cardForegroundColor = arcCol(cfg.titleFontColor, null) || fg;
  }
  var border = arcCol(cfg.panelBorderColor, null);
  if (border) {
    var alpha = cfg.panelBorderAlpha;
    alpha = typeof alpha === 'number' ? pyRound(alpha * 2.55) : 0xFF;
    light.borderColor = '#' + Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, '0').toUpperCase()
      + border.replace(/^#/, '').slice(-6);
    light.dividerColor = light.borderColor;
  }
  if (light.backgroundColor) light.popoverColor = light.backgroundColor;
  // 她 2026-09-22：arc 也没有「卡片」概念 —— 卡片背景取辅助背景色（arc 自己的卡片色没有对应
  // 槽位，见下面的 dropped；没辅助背景时干脆不写，交给 Reeden 自己的默认）
  if (light.mutedColor) light.cardColor = light.mutedColor;
  if (light.cardColor) light.dialogBackgroundColor = light.cardColor;
  light.backgroundImageFit = 'fill';
  light.author = '';
  light.description = '';
  dropped.push('按语义对的几处：界面字体色→前景色/卡片字色（标题字体色）、面板描边色+不透明度→描边/分割线、浮层与弹窗底色按 Reeden 自家写法取背景色/卡片色');
  dropped.push('卡片背景取辅助背景色、卡片圆角留「跟随全局」（arc 没有「卡片」概念，arc 自己的卡片色没写）');
  if (!light.mutedForegroundColor) {
    dropped.push('次要文字色（arc 没有这一项）未写：装上后若发现次要文字看不清/太浅，说一声我补');
  }
  return light;
}

/* ================================================================== 2) 内存 .red → 目标 */
async function packRed(model) {
  return concatBytes([RED_MAGIC, await zipBytes(model.files)]);
}
function argbIntOf(hexColor) {
  var raw = String(hexColor).replace(/^#/, '');
  var v = parseInt(raw, 16) >>> 0;
  if (raw.length <= 6) v = (v | 0xFF000000) >>> 0;
  return v >= 0x80000000 ? v - 4294967296 : v;
}
function rgbString(hexColor) { return '#' + String(hexColor).replace(/^#/, '').slice(-6).toUpperCase(); }
function imageExt(blob) {
  if (blob.length >= 8 && startsWith(blob, Uint8Array.of(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A))) return 'png';
  if (blob.length >= 3 && blob[0] === 0xFF && blob[1] === 0xD8 && blob[2] === 0xFF) return 'jpg';
  if (blob.length >= 12 && startsWith(blob, TE.encode('RIFF')) && TD.decode(blob.subarray(8, 12)) === 'WEBP') return 'webp';
  return 'img';
}
// 与 red_to_legado / red_to_arc 的排序键一致：整条路径去扩展名、去非数字，取数字
function coverSortKey(n) {
  var s = String(n).replace(/\.[^./]*$/, '').replace(/\D/g, '');
  var v = s ? parseInt(s, 10) : 0;
  return isNaN(v) ? 0 : v;
}
function coverEntries(names, gid) {
  return Array.from(names.keys()).filter(function (n) {
    return n.indexOf('cover_gallery/' + gid + '/') === 0 && !/meta\.json$/.test(n);
  }).sort(function (a, b) { return coverSortKey(a) - coverSortKey(b); });
}

/* ------------------------------------------------- .red → 阅读主题包 + 排版包 */
async function buildThemePackage(model, dropped) {
  var theme = model.theme, name = model.theme.name;
  var light = theme.light, dark = theme.dark || {};
  var names = model.files;
  var cfg = clone(THEME_SKELETON);
  var applied = [];
  Object.keys(PALETTE_INV).forEach(function (src) {
    if (src in light) {
      cfg[PALETTE_INV[src][0]] = argbIntOf(light[src]);
      applied.push(PALETTE_INV[src][0]);
    }
  });
  if (dark && dark.primaryColor === REEDEN_DEFAULT_NIGHT.primaryColor &&
      dark.backgroundColor === REEDEN_DEFAULT_NIGHT.backgroundColor) {
    Object.keys(PALETTE_INV).forEach(function (src) { cfg[PALETTE_INV[src][1]] = 0; });
    dropped.push('夜间配色（.red 里是 Reeden 默认夜间，说明源主题包没写夜间）：阅读这一侧留 0 = 跟随，没把 Reeden 的默认夜间搬过去');
  } else {
    Object.keys(PALETTE_INV).forEach(function (src) {
      if (src in dark) {
        cfg[PALETTE_INV[src][1]] = argbIntOf(dark[src]);
        applied.push(PALETTE_INV[src][1]);
      }
    });
  }
  if ('cardRadius' in light) {
    cfg.baseCardCornerRadius = Number(light.cardRadius);
    cfg.overrideBaseCardCornerRadius = true;
    applied.push('baseCardCornerRadius');
  }
  cfg.appTheme = '12';
  cfg.enableDeepPersonalization = true;

  var files = new Map(), assets = {};
  function add(rel, data) { files.set(rel, data); }
  [['light/theme_bg.img', 'background.light'], ['dark/theme_bg.img', 'background.dark']]
    .forEach(function (p) {
      if (!names.has(p[0])) return;
      var ext = imageExt(names.get(p[0]));
      var entry = 'assets/' + p[1].split('.')[0] + '/' + (p[0].indexOf('light') === 0 ? 'light' : 'dark') + '.' + ext;
      add(entry, names.get(p[0]));
      assets[p[1]] = entry;
    });
  var navId = light.navbarPackId, missingNav = [];
  Object.keys(NAV_INV).forEach(function (dst) {
    var src = NAV_INV[dst];
    [['normal', ''], ['selected', '-selected']].forEach(function (st) {
      var entry = 'navbar_pack/' + navId + '/' + dst + '_' + st[0] + '.png';
      if (names.has(entry)) {
        var rel = 'assets/navigation/' + NAV_ENTRY[src] + st[1] + '.png';
        add(rel, names.get(entry));
        assets['navigation.' + src + (st[0] === 'normal' ? '' : '.selected')] = rel;
      } else if (st[0] === 'normal') missingNav.push(src);
    });
  });
  if (missingNav.length) dropped.push('底栏图标 ' + missingNav.join('、') + '（.red 里没有）');
  var hasFeature = Array.from(names.keys()).some(function (n) {
    return n.indexOf('navbar_pack/') === 0 && n.endsWith('feature_normal.png');
  });
  if (hasFeature) dropped.push('底栏第 6 格 feature（阅读只有 5 格，没有槽位）');
  if (dark.navbarPackId && dark.navbarPackId !== light.navbarPackId) {
    dropped.push('夜间底栏图标（阅读的底栏图标只有一套，用的是日间那套）');
  }
  var spoken = ['inputBackgroundColor', 'searchFieldBackgroundColor', 'tabBackgroundColor',
    'shelfColor', 'themeEffectType', 'cardBackgroundBlur', 'backgroundImageOpacity', 'customSplashId']
    .filter(function (k) { return k in light; });
  if (spoken.length) dropped.push(spoken.join('、') + '（Reeden 专有项，阅读主题包没有对应字段）');
  dropped.push('应用字体：.red 里没有字体槽位，阅读包不带你那份 app.ttf');
  var albums = [];
  [['light', light.coverGalleryId], ['dark', (theme.dark || {}).coverGalleryId]].forEach(function (p) {
    if (!p[1]) return;
    var imgs = coverEntries(names, p[1]);
    var images = [];
    imgs.forEach(function (n, i) {
      var entry = 'cover-albums/album_0/' + p[0] + '/image_' + i + '.' + imageExt(names.get(n));
      add(entry, names.get(n));
      images.push({ path: entry });
    });
    if (images.length) albums.push({ group: p[0], images: images });
  });
  var coverAlbums = [{
    ref: 'album_0', name: name,
    lightImages: (albums.filter(function (a) { return a.group === 'light'; })[0] || { images: [] }).images,
    darkImages: (albums.filter(function (a) { return a.group === 'dark'; })[0] || { images: [] }).images
  }];
  if (!coverAlbums[0].lightImages.length && !coverAlbums[0].darkImages.length) {
    coverAlbums = [];
    dropped.push('封面图集（.red 里没有）');
  }
  [['light/bookshelf_carousel/', '书架头图'], ['dark/bookshelf_carousel/', '夜间书架头图'],
   ['light/card_bg.img', '卡片背景图'], ['dark/card_bg.img', '夜间卡片背景图'],
   ['custom_splash/', '启动图']].forEach(function (p) {
    var found = Array.from(names.keys()).some(function (n) { return n.indexOf(p[0]) === 0; });
    if (found) dropped.push(p[1] + '（阅读主题包没有对应槽位）');
  });
  if (light.author || light.description) {
    dropped.push('作者署名/说明文字（阅读主题包没有字段装，装进去只剩主题名）');
  }
  var manifest = { formatVersion: 1, name: name, config: cfg, assets: assets,
    coverAlbums: coverAlbums, coverSelection: { albumRef: 'album_0' } };
  add('manifest.json', jsonBytes(manifest));
  return { name: name + '.zip', bytesU8: await zipBytes(files) };
}

async function buildReadconfigPackage(model, dropped) {
  var theme = model.theme, name = theme.name;
  var light = theme.light, dark = theme.dark || {};
  var schemas = model.schemas;
  var rc = clone(READCONFIG_SKELETON);
  rc.name = name;
  var files = new Map();
  [['light', false], ['dark', true]].forEach(function (m) {
    var block = m[1] ? dark : light;
    var rid = block.readerColorSchemaId;
    if (!rid || !schemas[rid]) return;
    var schema = schemas[rid].schema, bg = schemas[rid].bg;
    var lc = applyLayout(JSON.parse(schema.layoutConfig));
    if (schema.boundTitleStyle) {
      dropped.push('题签样式「' + (schema.boundTitleStyle.name || '') + '」（阅读的标题样式没有这套结构，没带）');
    }
    if (String(schema.backgroundImageFit || '').indexOf('nineSlice') === 0) {
      dropped.push('阅读背景图的九宫格切图参数（阅读只按整图铺，没这个字段）');
    }
    var text = rgbString(schema.textColor);
    if (!m[1]) {
      Object.keys(LAYOUT_INV).forEach(function (redKey) {
        var v = lc[redKey];
        if (v === undefined || v === null || typeof v === 'boolean' || v === 'defaults') return;
        rc[LAYOUT_INV[redKey]] = Number(v);
      });
      if ('textSize' in rc && lc.titleFontSizeDiff !== undefined && lc.titleFontSizeDiff !== null) {
        if (Number(rc.textSize) + Number(lc.titleFontSizeDiff) > 0) {
          rc.titleSize = Number(rc.textSize) + Number(lc.titleFontSizeDiff);
        } else {
          dropped.push('标题字号：.red 里标题比正文小 ' + Math.abs(Number(lc.titleFontSizeDiff))
            + '（那份 .red 的排版值本身可疑），阅读这边没动，用你原来的');
        }
      }
    }
    var tail = m[1] ? 'Night' : '';
    rc['textColor' + tail] = text;
    var follow = new Set([argbIntOf(block.foregroundColor || '#FF000000'), argbIntOf(schema.textColor)]);
    [['tipHeaderColor', 'headerStatusBarFontColor'], ['tipFooterColor', 'footerStatusBarFontColor']]
      .forEach(function (p) {
        var v = argbIntOf(schema[p[1]]);
        rc[p[0] + tail] = follow.has(v) ? 0 : v;
      });
    if (bg) {
      var entry = (m[1] ? 'bg_' + name + '_night.' : 'bg_' + name + '.') + imageExt(bg);
      files.set(entry, bg);
      rc['bgType' + tail] = 2; rc['bgStr' + tail] = entry;
    } else {
      rc['bgType' + tail] = 0; rc['bgStr' + tail] = rgbString(schema.backgroundColor);
    }
    if (!m[1]) {
      TIP_KEYS.forEach(function (pair) {
        var srcSlot = pair[0], dstSlot = pair[1];
        var value = lc['statusItemType' + dstSlot];
        if (value === undefined || value === null) return;
        if (value === 'custom') {
          var tmpl = lc['customTemplate' + dstSlot] || '';
          var unknown = (tmpl.match(/\{[A-Za-z]+\}/g) || []).filter(function (t) { return !TOKEN_INV[t]; });
          if (!tmpl.trim() || unknown.length) {
            if (unknown.length) {
              dropped.push('页眉/页脚自定义 ' + dstSlot + '（含阅读不认识的占位符 '
                + Array.from(new Set(unknown)).sort().join('、') + '，整条没写）');
            }
            rc['tip' + srcSlot] = 0; rc['customTip' + srcSlot] = '';
            return;
          }
          Object.keys(TOKEN_INV).forEach(function (a) { tmpl = tmpl.split(a).join(TOKEN_INV[a]); });
          rc['tip' + srcSlot] = 18; rc['customTip' + srcSlot] = tmpl;
          return;
        }
        if (!(value in TIP_INV)) {
          dropped.push('页眉/页脚 ' + dstSlot + '：' + value + '（阅读这边没有对应项，没写）');
          return;
        }
        rc['tip' + srcSlot] = TIP_INV[value];
        rc['customTip' + srcSlot] = '';
        if ((TIP_AMBIGUOUS[value] || []).length > 1) {
          dropped.push('页眉/页脚 ' + dstSlot + '：' + value + ' 阅读侧有多个近义项，写的是 '
            + TIP_INV[value] + '（' + TIP_AMBIGUOUS[value].join('、') + '）');
        }
      });
    }
  });
  files.set('readConfig.json', jsonBytes(rc));
  return { name: name + '阅读页.zip', bytesU8: await zipBytes(files) };
}

/* ------------------------------------------------- .red → arc 外观套件 */
function arcDirname(name) {
  var d = String(name).replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim().replace(/^\.+|\.+$/g, '');
  return d || 'RED Theme';
}
function fixedUuid(seed) {
  var h = md5Hex(TE.encode(seed)).toLowerCase();
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-8' + h.slice(17, 20)
    + '-' + h.slice(20, 32);
}
async function buildKit(model, dropped) {
  var theme = model.theme, name = theme.name;
  var light = theme.light, dark = theme.dark || {};
  var names = model.files;
  var dirname = arcDirname(name);
  var files = new Map();
  function add(rel, data) { files.set(rel, data); }
  var cfg = { themeName: name, isNightTheme: false }, applied = [];
  Object.keys(ARC_PALETTE).forEach(function (redKey) {
    if (redKey in light) {
      cfg[ARC_PALETTE[redKey]] = '#' + String(light[redKey]).replace(/^#/, '').slice(-6).toUpperCase();
      applied.push(ARC_PALETTE[redKey]);
    }
  });
  var border = light.borderColor || '';
  if (border) {
    cfg.panelBorderColor = '#' + String(border).replace(/^#/, '').slice(-6).toUpperCase();
    cfg.panelBorderAlpha = Math.round(parseInt(String(border).replace(/^#/, '').slice(0, 2), 16) * 100 / 255);
    applied = applied.concat(['panelBorderColor', 'panelBorderAlpha']);
  }
  var spoken = Object.keys(ARC_NO_SLOT).filter(function (k) { return (k in light) || (k in dark); })
    .map(function (k) { return ARC_NO_SLOT[k]; });
  if (spoken.length) dropped.push(spoken.join('、') + '（arc 主题里没有这几个设置项）');
  [['light/theme_bg.img', 'backgroundImgPath'], ['light/card_bg.img', 'panelBackgroundImgPath']]
    .forEach(function (p) {
      if (!names.has(p[0])) return;
      var ext = imageExt(names.get(p[0]));
      var entry = p[0].indexOf('theme_bg') >= 0 ? dirname + '/background.' + ext
                                                : dirname + '/panel_background.' + ext;
      add(entry, names.get(p[0]));
      cfg[p[1]] = entry.split('/').slice(1).join('/');
    });
  if (cfg.panelBackgroundImgPath) cfg.panelBackgroundScaleType = 'crop';
  if (names.has('dark/theme_bg.img') || Object.keys(dark).length) {
    var nightIsDefault = dark.primaryColor === '#FF4B9FFF' && dark.backgroundColor === '#FF0E1116';
    if (!nightIsDefault) {
      dropped.push('夜间主题（arc 是日夜两个独立条目，这次只出了日间那份；要夜间那份说一声，我按 dark 块再出一套）');
    }
  }
  add(dirname + '/theme.json', jsonBytes({ config: cfg, dirName: dirname, isNightTheme: false,
    name: name, updatedAt: 0 }));
  var themeDayZip = await zipBytes(files);
  var components = [{ isNight: false, path: 'theme_day.zip', type: 'THEME' }];
  var navId = light.navbarPackId;
  if (navId) {
    var navFiles = new Map(), icons = {}, missing = [];
    Object.keys(NAV_RED).forEach(function (redSlot) {
      var arcSlot = NAV_RED[redSlot];
      ['normal', 'selected'].forEach(function (state) {
        var entry = 'navbar_pack/' + navId + '/' + redSlot + '_' + state + '.png';
        if (names.has(entry)) {
          var fn = arcSlot + '_' + state + '.png';
          navFiles.set(dirname + '/' + fn, names.get(entry));
          icons[arcSlot + '_' + state] = fn;
        } else if (state === 'normal') missing.push(redSlot);
      });
    });
    if (missing.length) dropped.push('底栏图标 ' + missing.join('、') + '（.red 里没有）');
    if (NAV_UNUSED.some(function (s) {
      return names.has('navbar_pack/' + navId + '/' + s + '_normal.png');
    })) dropped.push('底栏第 6 格 feature（arc 的「发现」已被 首页 占用，没写进去）');
    if (Object.keys(icons).length) {
      var cardAlpha = Math.floor(parseInt(String(light.cardColor || '#FF000000').replace(/^#/, '').slice(0, 2), 16) * 100 / 255);
      navFiles.set(dirname + '/navigation.json', jsonBytes({
        borderAlpha: 100, effectMode: 'glass', hideSearchInFloatingStyle: false, icons: icons,
        isNightMode: false, layoutMode: 'floating', name: name,
        opacity: cardAlpha >= 16 ? cardAlpha : 72, sidebarGravity: 'start', updatedAt: 0 }));
      var navZip = await zipBytes(navFiles);
      add('navigation_bar_day.zip', navZip);
      components.push({ isNight: false, path: 'navigation_bar_day.zip', type: 'NAVIGATION_BAR' });
    }
  }
  var gid = light.coverGalleryId;
  if (gid) {
    var imgs = coverEntries(names, gid);
    if (imgs.length) {
      var pkg = 'export_' + name + '_0';
      var cov = new Map(), images = [];
      imgs.forEach(function (n, i) {
        var fn = 'cover_' + (i + 1) + '.' + imageExt(names.get(n));
        cov.set(pkg + '/images/' + fn, names.get(n));
        images.push('images/' + fn);
      });
      cov.set(pkg + '/collection.json', jsonBytes({ dirName: dirname, id: fixedUuid(name + '|cover'),
        images: images, isNight: false, mode: 'random', name: name, updatedAt: 0 }));
      add('cover_collection_day.zip', await zipBytes(cov));
      components.push({ isNight: false, path: 'cover_collection_day.zip', type: 'COVER_COLLECTION' });
    }
  } else {
    dropped.push('封面图集（.red 里没有）');
  }
  var kit = {
    binding: {
      dayCoverCollection: { dirName: dirname, name: name },
      dayNavigationBar: { dirName: dirname, name: name },
      dayTheme: { dirName: dirname, name: name },
      floatingBottomBarHideSearch: false, preset: 'default'
    },
    components: components, exportedAt: 0, id: fixedUuid(name + '|kit'),
    name: '应用主题', version: 1
  };
  var out = new Map();
  out.set('appearance_kit.json', jsonBytes(kit));
  for (var i = 0; i < components.length; i++) {
    var p = components[i].path;
    out.set(p, files.has(p) ? files.get(p) : themeDayZip);
  }
  return { name: name + '.zip', bytesU8: await zipBytes(out) };
}

/* ================================================================== 3) 识别 */
var KIND_LABEL = {
  'rgshare2': 'Readingo 加密分享（RGSHARE2）',
  'rgshare': 'Readingo 分享（.rgshare）',
  'red': 'Reeden 未加密主题包（RED\\x04 / zip 形态）',
  'red-encrypted': 'Reeden 加密主题包（RED\\x10）',
  'md3': '阅读 MD3 主题包',
  'md3-paiban': '阅读排版包（MD3/arc 通用）',
  'arc-kit': '阅读 Archive 外观套件',
  'arc-paiban': '阅读排版包（arc）',
  'unknown': '识别不出这个格式'
};
var THEME_KINDS = ['red', 'rgshare', 'rgshare2', 'md3', 'arc-kit'];
var PAIBAN_KINDS = ['md3-paiban', 'arc-paiban'];

function detect(name, b) {
  try {
    if (!b || !b.length) return { kind: 'unknown', detail: '空文件' };
    if (b.length >= 8 && TD.decode(b.subarray(0, 8)) === 'RGSHARE2') {
      return { kind: 'rgshare2', detail: KIND_LABEL.rgshare2 };
    }
    if (b.length >= 4 && b[0] === 0x52 && b[1] === 0x45 && b[2] === 0x44 && b[3] === 0x04) {
      return { kind: 'red', detail: 'Reeden 未加密主题包（RED\\x04）' };
    }
    if (b.length >= 4 && b[0] === 0x52 && b[1] === 0x45 && b[2] === 0x44 && b[3] === 0x10) {
      return { kind: 'red-encrypted', detail: KIND_LABEL['red-encrypted'] };
    }
    if (!(b.length >= 2 && b[0] === 0x50 && b[1] === 0x4B)) {
      return { kind: 'unknown', detail: '既不是 zip 也不是主题包容器' };
    }
    var names = zipNames(b);
    if (!names) return { kind: 'unknown', detail: 'zip 中央目录损坏' };
    var has = function (n) { return names.indexOf(n) >= 0; };
    if (has('appearance_kit.json')) return { kind: 'arc-kit', detail: KIND_LABEL['arc-kit'] };
    if (has('manifest.json')) return { kind: 'md3', detail: KIND_LABEL.md3 };
    if (has('readConfig.json')) {
      // MD3 与 arc 的排版包是**同一个格式**（只是一个 readConfig.json），内容分不出来，
      // 只能按文件名认导出方（arc 的导出名里带 arc）。两种 kind 在转换里走完全相同的代码。
      var arcish = /arc/i.test(name);
      return { kind: arcish ? 'arc-paiban' : 'md3-paiban',
               detail: KIND_LABEL[arcish ? 'arc-paiban' : 'md3-paiban'] };
    }
    if (has('meta.json') || has('android.json')) return { kind: 'rgshare', detail: KIND_LABEL.rgshare };
    if (names.some(function (n) { return n === 'theme.json' || n.endsWith('/theme.json'); })) {
      return { kind: 'red', detail: 'Reeden 未加密主题包（zip 形态，等于 .red 去掉 RED\\x04）' };
    }
    return { kind: 'unknown', detail: '识别不出这个格式' };
  } catch (e) {
    return { kind: 'unknown', detail: '识别不出这个格式' };
  }
}

/* ================================================================== 4) 转换 */
// 文件名相似度：去噪后最长公共子串的长度
function similarity(a, b) {
  var x = String(a).replace(/[^A-Za-z0-9\u4e00-\u9fa5]+/g, '').toLowerCase();
  var y = String(b).replace(/[^A-Za-z0-9\u4e00-\u9fa5]+/g, '').toLowerCase();
  var best = 0, dp = new Array(y.length + 1).fill(0);
  for (var i = 1; i <= x.length; i++) {
    var prev = 0;
    for (var j = 1; j <= y.length; j++) {
      var t = dp[j];
      dp[j] = x[i - 1] === y[j - 1] ? prev + 1 : 0;
      if (dp[j] > best) best = dp[j];
      prev = t;
    }
  }
  return best;
}
function pairUp(themes, paibans) {
  var pool = paibans.slice(), pairs = [];
  themes.forEach(function (t) {
    var best = -1, bestScore = -1;
    pool.forEach(function (p, i) {
      var s = similarity(t.name, p.name);
      if (s > bestScore) { bestScore = s; best = i; }
    });
    if (best >= 0) pairs.push([t, pool.splice(best, 1)[0]]);
    else pairs.push([t, null]);
  });
  return pairs;
}

async function convert(files, targets, opts) {
  targets = (targets || []).slice();
  CURRENT_LAYOUT = sanitizeLayout(opts && opts.layout);
  var emit = (opts && typeof opts.onStage === 'function') ? opts.onStage : null;
  if (!targets.length) throw new Error('请至少选择一种输出格式');
  var items = files.map(function (f) {
    var b = f.bytesU8 instanceof Uint8Array ? f.bytesU8 : new Uint8Array(f.bytesU8);
    return { name: f.name, bytesU8: b, d: detect(f.name, b) };
  });
  items.forEach(function (it) {
    if (it.d.kind === 'red-encrypted') {
      throw new Error('「' + it.name + '」是 Reeden 的加密主题包，请重新用未加密格式导出（.red）');
    }
    if (it.d.kind === 'unknown') throw new Error('「' + it.name + '」识别不出这个格式');
  });
  var themes = items.filter(function (i) { return THEME_KINDS.indexOf(i.d.kind) >= 0; });
  var paibans = items.filter(function (i) { return PAIBAN_KINDS.indexOf(i.d.kind) >= 0; });
  if (!themes.length) throw new Error('这批文件里没有主题包（只有排版包时无法转换）');
  var pairs = pairUp(themes, paibans);
  var results = [];
  for (var pi = 0; pi < pairs.length; pi++) {
    var theme = pairs[pi][0], paiban = pairs[pi][1];
    var dropped = [], notes = [];
    var model;
    try {
    if (theme.d.kind === 'red') {
      var payload = theme.bytesU8;
      if (startsWith(payload, RED_MAGIC)) payload = payload.subarray(4);
      var zf = await unzip(payload);
      var tname = Array.from(zf.keys()).filter(function (k) { return /theme\.json$/.test(k); })[0];
      model = { name: J(zf.get(tname)).name, theme: J(zf.get(tname)), files: zf, dropped: dropped, notes: notes };
      notes.push('源就是该格式：Reeden 未加密主题包');
    } else if (theme.d.kind === 'rgshare2') {
      model = await redFromReadingo(await decryptRgshare2(theme.bytesU8), dropped, notes);
    } else if (theme.d.kind === 'rgshare') {
      model = await redFromReadingo(theme.bytesU8, dropped, notes);
    } else if (theme.d.kind === 'md3') {
      model = await redFromMd3(theme.bytesU8, paiban ? paiban.bytesU8 : null, dropped, notes);
    } else {
      model = await redFromArcKit(theme.bytesU8, paiban ? paiban.bytesU8 : null, dropped, notes);
    }
    model.schemas = model.schemas || schemasFromFiles(model.files);
    if (paiban) notes.push('排版包「' + paiban.name + '」已随主题一起转换');
    var srcLabel = theme.name;
    var group = [];
    for (var ti = 0; ti < targets.length; ti++) {
      var target = targets[ti];
      var mark = group.length;
      if (emit) emit({ phase: 'start', source: srcLabel, target: target });
      if (target === 'red') {
        if (theme.d.kind === 'red') {
          group.push({ name: model.name + '.red', source: srcLabel, bytesU8: null,
            extraNotes: ['源就是该格式（Reeden 未加密主题包），没有重新打包'] });
        } else {
          group.push({ name: model.name + '.red', source: srcLabel,
            bytesU8: await packRed(model), extraNotes: [] });
        }
      } else if (target === 'md3') {
        var r1 = await buildThemePackage(model, dropped);
        var r2 = await buildReadconfigPackage(model, dropped);
        group.push({ name: r1.name, source: srcLabel, bytesU8: r1.bytesU8, extraNotes: [], target: 'md3' });
        group.push({ name: r2.name, source: srcLabel, bytesU8: r2.bytesU8, extraNotes: [], target: 'md3' });
      } else if (target === 'arc') {
        var k1 = await buildKit(model, dropped);
        var k2 = await buildReadconfigPackage(model, dropped);
        group.push({ name: k1.name, source: srcLabel, bytesU8: k1.bytesU8, extraNotes: [], target: 'arc' });
        group.push({ name: k2.name, source: srcLabel, bytesU8: k2.bytesU8, extraNotes: [], target: 'arc' });
      }
      if (emit) emit({ phase: 'done', source: srcLabel, target: target, products: group.slice(mark) });
    }
    // 说明：本组内所有产物共享同一份「被丢弃/没能搬运」清单（与 Python 版的 dropped 同构）
    group.forEach(function (r) {
      r.notes = r.extraNotes.concat(notes, dropped);
      delete r.extraNotes;
      r.themeName = model.name;
      results.push(r);
    });
    } catch (err) {
      // 报错一律中文人话：已经是中文的直接抛，其余的换成一句能看懂的话
      var msg = (err && err.message) ? String(err.message) : '';
      if (/[\u4e00-\u9fa5]/.test(msg)) throw err;
      throw new Error('「' + theme.name + '」转换失败：这份文件的内容读不出来（可能不完整或格式对不上），换一份再试');
    }
  }
  // 多选导出时 MD3 与 Arc 会产出同一批文件名（<名字>.zip / <名字>阅读页.zip），
  // 重名的按格式加后缀，否则下载会互相覆盖、打包成一个 zip 时也会丢件。
  var nameCount = {};
  results.forEach(function (r) { nameCount[r.name] = (nameCount[r.name] || 0) + 1; });
  var TAGC = { md3: 'MD3', arc: 'Arc' };
  results.forEach(function (r) {
    if (nameCount[r.name] > 1 && r.target) {
      r.name = r.name.replace(/(\.[^.]*)$/, '（' + TAGC[r.target] + '）$1');
      r.notes = ['多选导出时同名文件按格式加了后缀，便于区分'].concat(r.notes || []);
    }
  });
  // 自定义导出名：每个产物都用它（只换主题名那一段，结构后缀如 .red / 阅读页.zip / （MD3）.zip 保留）。
  // 压缩包与压缩包里的每个文件都是这些产物本身，所以一并跟着改。
  var custom = sanitizeExportName(opts && opts.name);
  if (custom) {
    results.forEach(function (r) {
      var rest = r.name.indexOf(r.themeName) === 0
        ? r.name.slice(r.themeName.length)
        : (r.name.match(/\.[^.]+$/) || [''])[0];
      r.name = custom + rest;
    });
  }
  return results;
}

/* ------------------------------------------------------------- 自检指纹 */
// 验收用：把产物拆成 {条目名, 大小, md5, 解析后的 JSON}，供与 Python 版逐项比对
async function fingerprint(u8) {
  var payload = u8, prefix = '';
  if (startsWith(u8, RED_MAGIC)) { prefix = 'RED\\x04'; payload = u8.subarray(4); }
  var entries = await unzip(payload), out = [];
  for (var pair of entries) {
    var n = pair[0], d = pair[1];
    var e = { name: n, size: d.length, md5: md5Hex(d) };
    if (/\.json$/.test(n)) { try { e.json = J(d); } catch (err) { /* 忽略 */ } }
    if (/\.zip$/.test(n)) { try { e.nested = await fingerprint(d); } catch (err) { /* 忽略 */ } }
    out.push(e);
  }
  return { prefix: prefix, entries: out };
}


  return { detect, convert, fingerprint, md5Hex, zipBytes, KIND_LABEL };
})();

export const { detect, convert, fingerprint, md5Hex, zipBytes, KIND_LABEL } = Converter;
