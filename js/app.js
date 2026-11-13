/* Diialbum app script */
(() => {
'use strict';
/* ============ constants & helpers ============ */
const W = 540, H = 720, PADX = 6, PADY = 4, LH = 1.25;
const GUEST = '__guest__', USERS_KEY = 'diialbum.users', SESSION_KEY = 'diialbum.session';
const FONTS = {
  signature:  { label: 'Signature',  css: "'Great Vibes', cursive" },
  classic:    { label: 'Classic',    css: "'Dancing Script', cursive" },
  minimalist: { label: 'Minimalist', css: "'Patrick Hand', cursive" },
  vintage:    { label: 'Vintage',    css: "'Homemade Apple', cursive" }
};
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let state, images = {}, imgCache = {}, user = null, storageOK = true;
let selectedId = null, editingId = null, editBefore = null, blurHandler = null;
let drag = null, flipping = false, S = 1, layerDrag = null;
let undoStack = [], redoStack = [], lastTag = null, lastTime = 0;
const savedImgs = new Set();

/* ============ languages ============ */
const LANGS = [['vi', 'VN'], ['en', 'EN']];
const I18N = {
en: {
  tagline: 'little memories, kept softly', album: 'Album', newAlbum: 'Create new album', renameHint: 'Double-click a name to rename it.',
  layer: 'Layer', layerHint: 'Top = front. Drag rows to reorder. Click the active layer again to rename it. Shift+click to pick several, right-click for Group.',
  shortcuts: 'Shortcuts', kUndo: 'Undo', kRedo: 'Redo', kDelete: 'Delete selected', kSound: 'Sound on / off', kMove: 'Move selected 1px', kTurn: 'Turn page', kDraw: 'Pen / eraser', kLine: 'Draw line', kCrop: 'Crop photo',
  location: 'Location', free: 'Free', cancel: 'Cancel', apply: 'Apply',
  text: 'Text', newText: 'New text', addText: 'Add text', size: 'Size', colorStyle: 'Color & style', font: 'Font', customSize: 'Custom size', textColor: 'Text color', bold: 'Bold', italic: 'Italic', underline: 'Underline',
  draw: 'Draw', off: 'Off', color: 'Color', drawHint: 'Pick a tool and draw on the page. Each drawing session becomes one layer you can move and resize. Click the tool again or press Esc to stop. Afterwards, click a stroke and pick a color to recolor just that stroke.',
  tool_pen: 'Pen', tool_marker: 'Marker', tool_pencil: 'Pencil', tool_eraser: 'Eraser', toolOn: '{n} on', customColor: 'Custom color',
  line: 'Line', newLine: 'New line', drawLine: 'Draw line (L)', drawingLine: 'Drawing… (click again or Esc to stop)', colorWidth: 'Color & width', lineColor: 'Line color', lineWidth: 'Line width',
  style: 'Style', solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted', start: 'Start', end: 'End', lineHint: 'Drag on the page to draw. Hold Shift to snap to 45°. Drag the round ends to reshape.',
  cap_none: 'Flat', cap_round: 'Round', cap_arrow: 'Arrow', cap_triangle: 'Triangle', cap_open: 'Open arrow', cap_dot: 'Dot', cap_circle: 'Ring', cap_square: 'Square', cap_diamond: 'Diamond', cap_bar: 'Bar',
  photo: 'Photo', addPhoto: 'Add photo (or drop onto the page)', cropBtn: 'Crop selected photo (C)', createSticker: 'Create sticker', stickerHint: 'Drop an image here. The background is removed and a white border is added.', removingBg: 'Removing background…',
  stickers: 'Stickers', emoji: 'Emoji', palHint: 'Click to add, or drag onto the page.',
  export: 'Export', range: 'Range', currentPage: 'Current page', wholeAlbum: 'Whole album', format: 'Format', download: 'Download', preparing: 'Preparing…',
  delete: 'Delete', deleteSelected: 'Delete selected', trashHint: 'You can also drag a photo or text onto this button, or press Delete / X.',
  soundOnT: 'Sound on (click or press M to mute)', soundOffT: 'Sound off (click or press M to turn on)', lightT: 'Light theme (click for dark)', darkT: 'Dark theme (click for light)', undoT: 'Undo (Ctrl+Z)', redoT: 'Redo (Ctrl+Shift+Z)', language: 'Language',
  account: 'Account', signIn: 'Sign in', signUp: 'Sign up', gmail: 'Gmail', password: 'Password', pwPh: 'At least 6 characters', name: 'Name', namePh: 'Your name', createAccount: 'Create account', signOut: 'Sign out',
  savedDevice: '✓ Saved on this device', guest: 'Working as guest', savedGuest: '✓ Saved (guest). Sign in to keep it with your account', saving: 'Saving…', saveFail: '⚠ Could not save on this device', accountHint: 'Accounts and albums are kept in this browser on this device.',
  errEmail: 'Please enter a valid Gmail address', errPw: 'Password needs at least 6 characters', errName: 'Please enter your name', errExists: 'This Gmail already has an account. Sign in instead.', errNoAcc: 'No account found for this Gmail. Sign up first.', errWrongPw: 'Wrong password',
  nothingUndo: 'Nothing to undo', nothingRedo: 'Nothing to redo', deleted: 'Deleted {n}', movedTo: 'Moved {n} to page {p}', chooseImages: 'Please choose image files', cantRead: 'Could not read {n}',
  shrunk: 'Photo is larger than the page, so it was shrunk to fit. Drag a corner to resize.', selectFirst: 'Select a photo or text first', dropImage: 'Please drop an image file', noSubject: 'Could not find a subject in this image',
  stickerMade: 'Sticker created ✿', stickerKept: 'Sticker created ✿ (no clear background found, so the photo was kept whole)', stickerFail: 'Could not make a sticker from this image',
  created: 'Created {n}', albumDeleted: 'Album deleted (Ctrl+Z to undo)', storageBlocked: 'This browser blocks local storage for this file. Your work will not be kept after closing.',
  welcome: 'Welcome, {n} ♡', welcomeBack: 'Welcome back, {n} ♡', signedOut: 'Signed out', soundOn: '♪ Sound on', soundOff: 'Sound off',
  emptyAlbum: 'This album is still empty', downloaded: 'Downloaded ✓', downloadedN: 'Downloaded {n} pages ✓ (allow multiple downloads if your browser asks)', exportFail: 'Export failed: {n}',
  selectPhotoCrop: 'Select a photo to crop', photoMissing: 'This photo is missing', cropHelp: 'Drag the corners to crop · Enter to apply · Esc to cancel', cropped: 'Cropped ✓ (Ctrl+Z to undo)', cropFail: 'Could not crop this photo', stickerAddFail: 'Could not add that sticker',
  confirmDelAlbum: 'Delete "{n}" and everything in it?', items: '{n} items', deleteAlbum: 'Delete album', prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page {p}', pageOf: 'Page {p} / {t}',
  noLayers: 'No photos or text on this page yet', editing: 'Editing {n}', fwd: 'Bring forward', back: 'Send backward',
  wx_clear: 'Sunny', wx_partly: 'Partly cloudy', wx_overcast: 'Overcast', wx_fog: 'Foggy', wx_drizzle: 'Drizzle', wx_rain: 'Rain', wx_heavyrain: 'Heavy rain', wx_thunder: 'Thunderstorm', wx_storm: 'Storm',
  clearNight: 'Clear night', cloudyNight: 'Cloudy night', sunset: 'Sunset', sunrise: 'Sunrise', noWx: 'No weather data',
  wxTip: '{city}: {temp}°C, {label}\nClouds {c}% · Rain {r} mm · Wind {w} km/h\nSunrise {sr} · Sunset {ss}\nUpdated {u} (Open-Meteo, every 10 min)', wxFail: 'Could not load live weather. Check your internet connection.',
  font_signature: 'Signature', font_classic: 'Classic', font_minimalist: 'Minimalist', font_vintage: 'Vintage',
  rotate: 'Rotate 15° (R)', kRotate: 'Rotate (Shift+R: back)', rotateT: 'Drag to rotate (hold Shift: 15° steps)', selectRotate: 'Select something to rotate',
  addPage: 'Add a page', deletePage: 'Delete this page', goPh: 'Page #', goT: 'Type a page number and press Enter',
  confirmDelPage: 'Delete page {p} and everything on it?', pageAdded: 'Added page {p}', pageDeleted: 'Deleted page {p}',
  onlyN: 'This album has {n} pages. Press + to add more.', minOnePage: 'An album needs at least one page',
  alignLeft: 'Align left', alignCenter: 'Center', alignRight: 'Align right',
  photoStyle: 'Color style', strength: 'Strength', frame: 'Frame', selectPhotoStyle: 'Select a photo to change its style.',
  fx_none: 'Original', fx_bw: 'B&W', fx_warm: 'Warm', fx_cool: 'Cool', fx_vintage: 'Vintage', fx_fade: 'Fade', fx_vivid: 'Vivid', fx_rosy: 'Rosy', fx_noir: 'Noir', fx_dreamy: 'Dreamy',
  frame_none: 'No frame', frame_rounded: 'Rounded', frame_circle: 'Circle', frame_white: 'White border', frame_polaroid: 'Polaroid', frame_shadow: 'Shadow',
  sceneT: 'Choose a scene, or follow the real weather', scene_live: '● Real weather', scene_sunny: 'Sunny', scene_cloudy: 'Cloudy', scene_rain: 'Rain', scene_thunder: 'Thunderstorm',
  scene_snow: 'Snow', scene_fog: 'Fog', scene_rainbow: 'Rainbow', scene_aurora: 'Aurora', scene_stars: 'Starry night', scene_sunset: 'Sunset', scene_sakura: 'Cherry blossoms',
  ctxGroup: 'Group', ctxUngroup: 'Ungroup', ctxFront: 'Bring to front', ctxBack: 'Send to back', ctxAll: 'Select all', ctxDelete: 'Delete',
  needTwo: 'Select 2 or more items to group (Shift+click or Ctrl+A)', grouped: 'Grouped as {n}', ungrouped: 'Ungrouped', noGroup: 'Nothing in the selection is grouped',
  itemsN: '{n} items', selectedN: '{n} selected', kMulti: 'Select more / all', kGroup: 'Group / ungroup',
  stkNamePh: 'e.g. red tree, sleepy pink bunny…', stkCreate: 'Create this sticker', stkHint: 'Describe it in your own words: “red tree”, “3 pink cats”, “cute sparkly green dinosaur”… For a word sticker, start with “text”.',
  stickerBlob: 'Sticker created ✿ (no ready-made picture for “{q}”, so I drew a cute little character)',
  tintLbl: 'Change color', tintCustom: 'Pick a color', tintHint: 'Mixes your color into the photo. Use Strength to keep more of the original.',
  mine: 'Mine', noMine: 'Stickers you create will appear here.', typeStickerName: 'Type a sticker name first', deleteSticker: 'Remove',
  exportFolder: 'Saved {n} pages into the folder "{f}" ✓', exportZip: 'Downloaded "{f}.zip": a folder with {n} pages ✓', exportCancel: 'Export cancelled'
},
vi: {
  tagline: 'lưu giữ kỷ niệm nhỏ thật dịu dàng', album: 'Album', newAlbum: 'Tạo album mới', renameHint: 'Nhấp đúp vào tên để đổi tên.',
  layer: 'Lớp', layerHint: 'Trên cùng = phía trước. Kéo hàng để đổi thứ tự. Bấm lại lớp đang chọn để đổi tên. Shift+bấm để chọn nhiều, chuột phải để tạo group.',
  shortcuts: 'Phím tắt', kUndo: 'Hoàn tác', kRedo: 'Làm lại', kDelete: 'Xóa mục đang chọn', kSound: 'Bật / tắt âm thanh', kMove: 'Dịch mục đang chọn 1px', kTurn: 'Lật trang', kDraw: 'Bút / tẩy', kLine: 'Vẽ đường thẳng', kCrop: 'Cắt ảnh',
  location: 'Vị trí', free: 'Tự do', cancel: 'Hủy', apply: 'Áp dụng',
  text: 'Chữ', newText: 'Chữ mới', addText: 'Thêm chữ', size: 'Cỡ chữ', colorStyle: 'Màu & kiểu', font: 'Phông chữ', customSize: 'Cỡ tùy chỉnh', textColor: 'Màu chữ', bold: 'Đậm', italic: 'Nghiêng', underline: 'Gạch chân',
  draw: 'Vẽ', off: 'Tắt', color: 'Màu', drawHint: 'Chọn một công cụ rồi vẽ lên trang. Mỗi lần vẽ thành một lớp có thể di chuyển và đổi kích thước. Bấm lại công cụ hoặc nhấn Esc để dừng. Vẽ xong, bấm vào một nét rồi chọn màu để đổi màu riêng nét đó.',
  tool_pen: 'Bút', tool_marker: 'Bút dạ', tool_pencil: 'Bút chì', tool_eraser: 'Tẩy', toolOn: 'Đang dùng {n}', customColor: 'Màu tùy chọn',
  line: 'Đường thẳng', newLine: 'Đường mới', drawLine: 'Vẽ đường thẳng (L)', drawingLine: 'Đang vẽ… (bấm lại hoặc Esc để dừng)', colorWidth: 'Màu & độ dày', lineColor: 'Màu đường', lineWidth: 'Độ dày',
  style: 'Kiểu nét', solid: 'Liền', dashed: 'Gạch', dotted: 'Chấm', start: 'Đầu', end: 'Đuôi', lineHint: 'Kéo trên trang để vẽ. Giữ Shift để thẳng theo góc 45°. Kéo hai đầu tròn để chỉnh lại.',
  cap_none: 'Phẳng', cap_round: 'Tròn', cap_arrow: 'Mũi tên', cap_triangle: 'Tam giác', cap_open: 'Mũi tên hở', cap_dot: 'Chấm', cap_circle: 'Vòng tròn', cap_square: 'Vuông', cap_diamond: 'Kim cương', cap_bar: 'Gạch ngang',
  photo: 'Ảnh', addPhoto: 'Thêm ảnh (hoặc thả vào trang)', cropBtn: 'Cắt ảnh đang chọn (C)', createSticker: 'Tạo sticker', stickerHint: 'Thả ảnh vào đây. Nền sẽ được xóa và thêm viền trắng.', removingBg: 'Đang xóa nền…',
  stickers: 'Sticker', emoji: 'Emoji', palHint: 'Bấm để thêm, hoặc kéo vào trang.',
  export: 'Xuất file', range: 'Phạm vi', currentPage: 'Trang hiện tại', wholeAlbum: 'Cả album', format: 'Định dạng', download: 'Tải xuống', preparing: 'Đang chuẩn bị…',
  delete: 'Xóa', deleteSelected: 'Xóa mục đang chọn', trashHint: 'Bạn cũng có thể kéo ảnh hoặc chữ thả vào nút này, hoặc nhấn Delete / X.',
  soundOnT: 'Đang bật âm thanh (bấm hoặc nhấn M để tắt)', soundOffT: 'Đang tắt âm thanh (bấm hoặc nhấn M để bật)', lightT: 'Giao diện sáng (bấm để chuyển tối)', darkT: 'Giao diện tối (bấm để chuyển sáng)', undoT: 'Hoàn tác (Ctrl+Z)', redoT: 'Làm lại (Ctrl+Shift+Z)', language: 'Ngôn ngữ',
  account: 'Tài khoản', signIn: 'Đăng nhập', signUp: 'Đăng ký', gmail: 'Gmail', password: 'Mật khẩu', pwPh: 'Ít nhất 6 ký tự', name: 'Tên', namePh: 'Tên của bạn', createAccount: 'Tạo tài khoản', signOut: 'Đăng xuất',
  savedDevice: '✓ Đã lưu trên máy này', guest: 'Đang dùng với tư cách khách', savedGuest: '✓ Đã lưu (khách). Đăng nhập để giữ vào tài khoản của bạn', saving: 'Đang lưu…', saveFail: '⚠ Không lưu được trên máy này', accountHint: 'Tài khoản và album được lưu trong trình duyệt trên máy này.',
  errEmail: 'Vui lòng nhập địa chỉ Gmail hợp lệ', errPw: 'Mật khẩu cần ít nhất 6 ký tự', errName: 'Vui lòng nhập tên của bạn', errExists: 'Gmail này đã có tài khoản. Hãy đăng nhập.', errNoAcc: 'Không tìm thấy tài khoản cho Gmail này. Hãy đăng ký trước.', errWrongPw: 'Sai mật khẩu',
  nothingUndo: 'Không còn gì để hoàn tác', nothingRedo: 'Không còn gì để làm lại', deleted: 'Đã xóa {n}', movedTo: 'Đã chuyển {n} sang trang {p}', chooseImages: 'Vui lòng chọn file ảnh', cantRead: 'Không đọc được {n}',
  shrunk: 'Ảnh lớn hơn trang nên đã được thu nhỏ cho vừa. Kéo góc để đổi kích thước.', selectFirst: 'Hãy chọn một ảnh hoặc chữ trước', dropImage: 'Vui lòng thả file ảnh', noSubject: 'Không tìm thấy chủ thể trong ảnh này',
  stickerMade: 'Đã tạo sticker ✿', stickerKept: 'Đã tạo sticker ✿ (không tìm thấy nền rõ ràng nên giữ nguyên ảnh)', stickerFail: 'Không tạo được sticker từ ảnh này',
  created: 'Đã tạo {n}', albumDeleted: 'Đã xóa album (Ctrl+Z để hoàn tác)', storageBlocked: 'Trình duyệt chặn lưu trữ cho file này. Dữ liệu sẽ mất khi đóng trang.',
  welcome: 'Chào mừng, {n} ♡', welcomeBack: 'Chào mừng trở lại, {n} ♡', signedOut: 'Đã đăng xuất', soundOn: '♪ Đã bật âm thanh', soundOff: 'Đã tắt âm thanh',
  emptyAlbum: 'Album này vẫn còn trống', downloaded: 'Đã tải xuống ✓', downloadedN: 'Đã tải {n} trang ✓ (cho phép tải nhiều file nếu trình duyệt hỏi)', exportFail: 'Xuất file thất bại: {n}',
  selectPhotoCrop: 'Hãy chọn một ảnh để cắt', photoMissing: 'Ảnh này bị thiếu', cropHelp: 'Kéo các góc để cắt · Enter để áp dụng · Esc để hủy', cropped: 'Đã cắt ✓ (Ctrl+Z để hoàn tác)', cropFail: 'Không cắt được ảnh này', stickerAddFail: 'Không thêm được sticker đó',
  confirmDelAlbum: 'Xóa "{n}" và toàn bộ nội dung bên trong?', items: '{n} mục', deleteAlbum: 'Xóa album', prevPage: 'Trang trước', nextPage: 'Trang sau', pageN: 'Trang {p}', pageOf: 'Trang {p} / {t}',
  noLayers: 'Trang này chưa có ảnh hay chữ', editing: 'Đang sửa {n}', fwd: 'Đưa lên trước', back: 'Đưa ra sau',
  wx_clear: 'Nắng', wx_partly: 'Có mây', wx_overcast: 'Trời râm', wx_fog: 'Sương mù', wx_drizzle: 'Mưa phùn', wx_rain: 'Mưa', wx_heavyrain: 'Mưa to', wx_thunder: 'Giông', wx_storm: 'Bão',
  clearNight: 'Đêm quang', cloudyNight: 'Đêm nhiều mây', sunset: 'Hoàng hôn', sunrise: 'Bình minh', noWx: 'Không có dữ liệu thời tiết',
  wxTip: '{city}: {temp}°C, {label}\nMây {c}% · Mưa {r} mm · Gió {w} km/h\nMặt trời mọc {sr} · lặn {ss}\nCập nhật {u} (Open-Meteo, mỗi 10 phút)', wxFail: 'Không tải được thời tiết. Hãy kiểm tra kết nối mạng.',
  font_signature: 'Chữ ký', font_classic: 'Cổ điển', font_minimalist: 'Tối giản', font_vintage: 'Hoài cổ',
  rotate: 'Xoay 15° (R)', kRotate: 'Xoay (Shift+R: xoay ngược)', rotateT: 'Kéo để xoay (giữ Shift: mỗi lần 15°)', selectRotate: 'Hãy chọn một mục để xoay',
  addPage: 'Thêm trang', deletePage: 'Xóa trang này', goPh: 'Số trang', goT: 'Gõ số trang rồi nhấn Enter',
  confirmDelPage: 'Xóa trang {p} và mọi thứ trên trang đó?', pageAdded: 'Đã thêm trang {p}', pageDeleted: 'Đã xóa trang {p}',
  onlyN: 'Album này có {n} trang. Bấm + để thêm trang.', minOnePage: 'Album cần ít nhất một trang',
  alignLeft: 'Căn trái', alignCenter: 'Căn giữa', alignRight: 'Căn phải',
  photoStyle: 'Màu ảnh', strength: 'Độ đậm', frame: 'Khung ảnh', selectPhotoStyle: 'Chọn một ảnh để chỉnh style.',
  fx_none: 'Gốc', fx_bw: 'Trắng đen', fx_warm: 'Ấm', fx_cool: 'Lạnh', fx_vintage: 'Cổ điển', fx_fade: 'Phai màu', fx_vivid: 'Rực rỡ', fx_rosy: 'Hồng', fx_noir: 'Noir', fx_dreamy: 'Mơ màng',
  frame_none: 'Không khung', frame_rounded: 'Bo góc', frame_circle: 'Tròn', frame_white: 'Viền trắng', frame_polaroid: 'Polaroid', frame_shadow: 'Đổ bóng',
  sceneT: 'Chọn khung cảnh, hoặc theo thời tiết thật', scene_live: '● Thời tiết thật', scene_sunny: 'Nắng', scene_cloudy: 'Nhiều mây', scene_rain: 'Mưa', scene_thunder: 'Giông',
  scene_snow: 'Tuyết', scene_fog: 'Sương mù', scene_rainbow: 'Cầu vồng', scene_aurora: 'Cực quang', scene_stars: 'Đêm đầy sao', scene_sunset: 'Hoàng hôn', scene_sakura: 'Hoa anh đào',
  ctxGroup: 'Tạo group', ctxUngroup: 'Bỏ group', ctxFront: 'Đưa lên trên cùng', ctxBack: 'Đưa xuống dưới cùng', ctxAll: 'Chọn tất cả', ctxDelete: 'Xóa',
  needTwo: 'Chọn từ 2 mục trở lên để tạo group (Shift+bấm hoặc Ctrl+A)', grouped: 'Đã tạo {n}', ungrouped: 'Đã bỏ group', noGroup: 'Các mục đang chọn chưa có group',
  itemsN: '{n} mục', selectedN: 'Đã chọn {n}', kMulti: 'Chọn thêm / chọn hết', kGroup: 'Tạo / bỏ group',
  stkNamePh: 'vd: cây đỏ, thỏ hồng buồn ngủ…', stkCreate: 'Tạo sticker này', stkHint: 'Tả theo ý bạn: “cây đỏ”, “3 con mèo hồng”, “khủng long xanh lá dễ thương lấp lánh”… Muốn sticker chữ thì gõ “text” ở đầu.',
  stickerBlob: 'Đã tạo sticker ✿ (chưa có hình sẵn cho “{q}”, nên mình vẽ một bé dễ thương)',
  tintLbl: 'Đổi màu ảnh', tintCustom: 'Chọn màu', tintHint: 'Trộn màu bạn chọn vào ảnh. Kéo Độ đậm để giữ lại nhiều màu gốc hơn.',
  mine: 'Của tôi', noMine: 'Sticker bạn tạo sẽ hiện ở đây.', typeStickerName: 'Hãy gõ tên sticker trước', deleteSticker: 'Xóa',
  exportFolder: 'Đã lưu {n} trang vào folder "{f}" ✓', exportZip: 'Đã tải "{f}.zip": một folder chứa {n} trang ✓', exportCancel: 'Đã hủy xuất file'
},
};
let LANG = 'en';
function t(k, v) {
  let s = (I18N[LANG] && I18N[LANG][k]) ?? I18N.en[k] ?? k;
  if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
}
function detectLang() {
  return 'en'; // the app always opens in English
}
function applyLang() {
  LANG = I18N[state.settings.lang] ? state.settings.lang : 'en';
  document.documentElement.lang = LANG;
  $$('[data-i18n]').forEach(el => { el.textContent = (el.dataset.pre || '') + t(el.dataset.i18n); });
  $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$('.capgrid button').forEach(b => { b.title = t('cap_' + b.dataset.cap); });
  $$('#fontChips button').forEach(b => { const l = b.querySelector('.fl'); if (l) l.textContent = t('font_' + b.dataset.font); });
  $$('#drawTools button').forEach(b => { const k = b.dataset.tool; b.querySelector('span').textContent = t('tool_' + k); b.title = t('tool_' + k) + (k === 'pen' ? ' (B)' : k === 'eraser' ? ' (E)' : ''); });
  const dc = $('#drawColor'); if (dc) dc.title = t('customColor');
  $$('#langSeg button').forEach(b => b.classList.toggle('on', b.dataset.l === LANG));
  const lb = $('#lineBtn'); if (lb) lb.textContent = '✎ ' + t(lineMode ? 'drawingLine' : 'drawLine');
  $$('#citySel option').forEach(o => { o.textContent = cityName(o.value); });
  $$('#sceneSel option').forEach(o => { o.textContent = o.value === 'live' ? t('scene_live') : SCENES[o.value].icon + ' ' + t('scene_' + o.value); });
  if (typeof updateWeather === 'function' && Sky.ready) updateWeather();
}

const pageEl = $('#page'), scaler = $('#scaler'), bookBox = $('#bookBox'), bookArea = $('#bookArea');

/* ============ state ============ */
function newAlbum(name) { return { id: uid(), name, page: 1, pages: 10, elements: [], counters: { img: 0, text: 0 } }; }
function defaultState() {
  const a = newAlbum('Album 1');
  return { albums: [a], activeAlbumId: a.id, albumCounter: 1,
    settings: { sound: true, theme: 'light', city: 'hcm', lang: detectLang(), scene: 'live' },
    textDefaults: { size: 32, color: '#6b4a42', bold: false, italic: false, underline: false, font: 'classic', align: 'left' },
    lineDefaults: { color: '#c4836f', width: 4, dash: 'solid', start: 'none', end: 'arrow' },
    drawDefaults: { color: '#5e3f37', size: 6 }, myStickers: [] };
}
function normalize(st) {
  const d = defaultState();
  st.settings = Object.assign(d.settings, st.settings || {});
  st.lineDefaults = Object.assign(d.lineDefaults, st.lineDefaults || {});
  st.drawDefaults = Object.assign(d.drawDefaults, st.drawDefaults || {});
  if (!Array.isArray(st.myStickers)) st.myStickers = [];
  st.textDefaults = Object.assign(d.textDefaults, st.textDefaults || {});
  if (!st.albums || !st.albums.length) { st.albums = d.albums; st.activeAlbumId = d.activeAlbumId; }
  if (!st.albums.find(a => a.id === st.activeAlbumId)) st.activeAlbumId = st.albums[0].id;
  st.albumCounter = st.albumCounter || st.albums.length;
  st.albums.forEach(a => { if (!a.pages) a.pages = Math.max(10, a.page || 1, ...a.elements.map(e => e.page)); a.page = clamp(a.page || 1, 1, a.pages); });
  return st;
}
const album = () => state.albums.find(a => a.id === state.activeAlbumId) || state.albums[0];
const page = () => album().page;
const pageEls = (p = page(), a = album()) => a.elements.filter(e => e.page === p);
const findEl = id => album().elements.find(e => e.id === id);
const maxZ = p => Math.max(0, ...pageEls(p).map(e => e.z));
const domOf = id => pageEl.querySelector(`.el[data-id="${id}"]`);

/* ============ history ============ */
const snap = () => JSON.stringify({ albums: state.albums, activeAlbumId: state.activeAlbumId });
function pushHistory(tag) {
  const now = Date.now();
  if (tag && tag === lastTag && now - lastTime < 800) { lastTime = now; return; }
  lastTag = tag || null; lastTime = now;
  undoStack.push(snap()); if (undoStack.length > 150) undoStack.shift();
  redoStack.length = 0;
}
function restore(s) {
  const o = JSON.parse(s);
  state.albums = o.albums; state.activeAlbumId = o.activeAlbumId;
  if (!state.albums.find(a => a.id === state.activeAlbumId)) state.activeAlbumId = state.albums[0].id;
  if (selectedId && !findEl(selectedId)) selectedId = null;
  renderAll(); markDirty();
}
function undo() {
  finishEdit();
  if (!undoStack.length) return toast(t('nothingUndo'));
  redoStack.push(snap()); restore(undoStack.pop()); lastTag = null;
}
function redo() {
  finishEdit();
  if (!redoStack.length) return toast(t('nothingRedo'));
  undoStack.push(snap()); restore(redoStack.pop()); lastTag = null;
}

/* ============ rendering ============ */
function place(d, e) {
  d.style.left = e.x + 'px'; d.style.top = e.y + 'px';
  d.style.width = e.w + 'px'; d.style.height = e.h + 'px'; d.style.zIndex = e.z;
  if (e.type === 'img') d.style.setProperty('--m', Math.min(e.w, e.h) + 'px');
  if (e.type !== 'line') { d.style.transform = e.rot ? `rotate(${e.rot}deg)` : ''; d.classList.toggle('rot-below', e.y < 34); }
}
function ext(e) { // half-size of the rotated box
  const r = (e.rot || 0) * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  return { hx: (e.w * c + e.h * s) / 2, hy: (e.w * s + e.h * c) / 2 };
}
const normDeg = r => { r = ((r % 360) + 540) % 360 - 180; return Math.round(r * 10) / 10; };
function setRot(e, r) {
  e.rot = normDeg(r); if (!e.rot) delete e.rot;
  const { hx, hy } = ext(e), k = Math.min(1, W / (hx * 2), H / (hy * 2));
  if (k < 1) { // too big to turn inside the page: shrink it just enough, around its centre
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    e.w *= k; e.h *= k; e.x = cx - e.w / 2; e.y = cy - e.h / 2;
  }
  const p = clampPos(e, e.x, e.y); e.x = p.x; e.y = p.y; updateDom(e); return true;
}
function rotateDrag(e, ev) {
  const pt = toPage(ev), cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (drag.a0 == null) { const p0 = toPage({ clientX: drag.sx, clientY: drag.sy }); drag.a0 = Math.atan2(p0.y - cy, p0.x - cx) * 180 / Math.PI; drag.r0 = e.rot || 0; }
  let r = drag.r0 + Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI - drag.a0;
  if (ev.shiftKey) r = Math.round(r / 15) * 15;
  setRot(e, r);
}
function rotateSelected(deg, one) {
  const e = one || (selectedId && findEl(selectedId));
  if (!e) return toast(t('selectRotate'));
  if (!one && getSel().length > 1) { pushHistory('rotate'); getSel().map(findEl).filter(Boolean).forEach(x => { lastTag = 'rotate'; lastTime = Date.now(); rotateSelected(deg, x); }); updateSelBox(); return; }
  finishEdit(); if (crop) endCrop();
  pushHistory('rotate');
  if (e.type === 'line') {
    const A = lineAbs(e, 'a'), B = lineAbs(e, 'b'), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, r = deg * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
    const rot = P => ({ x: mx + (P.x - mx) * c - (P.y - my) * sn, y: my + (P.x - mx) * sn + (P.y - my) * c });
    const A2 = rot(A), B2 = rot(B);
    const x0 = Math.min(A2.x, B2.x), x1 = Math.max(A2.x, B2.x), y0 = Math.min(A2.y, B2.y), y1 = Math.max(A2.y, B2.y);
    if (x1 - x0 > W || y1 - y0 > H) return;
    const dx = x0 < 0 ? -x0 : x1 > W ? W - x1 : 0, dy = y0 < 0 ? -y0 : y1 > H ? H - y1 : 0;
    setLinePoints(e, A2.x + dx, A2.y + dy, B2.x + dx, B2.y + dy); rerenderEl(e);
  } else setRot(e, (e.rot || 0) + deg);
  markDirty();
}
function styleText(t, e) {
  t.style.fontFamily = FONTS[e.font] ? FONTS[e.font].css : FONTS.classic.css;
  t.style.fontSize = e.size + 'px'; t.style.color = e.color;
  t.style.fontWeight = e.bold ? '700' : '400';
  t.style.fontStyle = e.italic ? 'italic' : 'normal';
  t.style.textDecoration = e.underline ? 'underline' : 'none';
  t.style.textAlign = e.align || 'left';
}
function elNode(e) {
  const d = document.createElement('div');
  d.className = 'el ' + (e.type === 'img' ? 'el-img' : 'el-text');
  d.dataset.id = e.id; place(d, e);
  if (e.type === 'draw') {
    d.className = 'el el-draw' + selCls(e.id); drawNode(e, d);
    for (const h of ['tl', 'tr', 'bl', 'br', 'rot']) { const k = document.createElement('div'); k.className = 'hd ' + h; k.dataset.h = h; if (h === 'rot') k.title = t('rotateT'); d.appendChild(k); }
    return d;
  }
  if (e.type === 'line') {
    d.classList.remove('el-text'); d.className = 'el el-line'; d.dataset.id = e.id;
    { const c = selCls(e.id).trim(); if (c) d.classList.add(c); }
    d.innerHTML = `<svg width="${e.w}" height="${e.h}"><path class="main-hl" d="M${e.ax} ${e.ay}L${e.bx} ${e.by}" stroke="#c4836f" stroke-opacity=".25" stroke-width="${e.width + 8}" stroke-linecap="round" fill="none" style="display:none"/>${lineSVG(e)}<path class="hit" d="M${e.ax} ${e.ay}L${e.bx} ${e.by}" stroke="transparent" stroke-width="${Math.max(16, e.width + 12)}" stroke-linecap="round" fill="none"/></svg>`;
    for (const [h, x, y] of [['p1', e.ax, e.ay], ['p2', e.bx, e.by]]) { const k = document.createElement('div'); k.className = 'hd ' + h; k.dataset.h = h; k.style.left = x + 'px'; k.style.top = y + 'px'; d.appendChild(k); }
    return d;
  }
  if (e.type === 'img') {
    if (images[e.imgId]) { const im = new Image(); im.src = images[e.imgId]; im.draggable = false; im.alt = e.name; im.style.filter = fxCss(e); d.appendChild(im); }
    else d.classList.add('missing');
    d.classList.add('frame-' + (e.frame || 'none'));
  } else {
    const t = document.createElement('div'); t.className = 'txt'; t.textContent = e.text; styleText(t, e); d.appendChild(t);
  }
  for (const h of ['tl', 'tr', 'bl', 'br', 'rot']) { const k = document.createElement('div'); k.className = 'hd ' + h; k.dataset.h = h; if (h === 'rot') k.title = t('rotateT'); d.appendChild(k); }
  { const c = selCls(e.id).trim(); if (c) d.classList.add(c); }
  return d;
}
function fillPage(container, p) {
  container.querySelectorAll('.el,.pnum').forEach(n => n.remove());
  const n = document.createElement('div'); n.className = 'pnum'; n.textContent = p; container.appendChild(n);
  pageEls(p).sort((a, b) => a.z - b.z).forEach(e => container.appendChild(elNode(e)));
}
function renderPage() {
  if (crop) endCrop();
  if (selectedId && !pageEls().some(e => e.id === selectedId)) selectedId = null;
  fillPage(pageEl, page());
  updateSelBox();
  $('#albumTitle').textContent = album().name;
}
function updateDom(e) { const d = domOf(e.id); if (d) place(d, e); }
function renderAll() {
  applyLang(); applySettings(); renderMine(); renderAlbums(); renderPage(); renderLayers(); renderPager(); syncTextControls(); renderAuth();
}
function select(id) { setSel(id ? [id] : [], id); }
function selCls(id) { const s = getSel(); return s.includes(id) ? (s.length > 1 ? ' msel' : ' sel') : ''; }

/* ============ pager & flipping ============ */
function renderPager() {
  const N = album().pages, p = page(), pg = $('#pager'); pg.innerHTML = '';
  const mk = (label, target, cls, disabled) => {
    const b = document.createElement('button'); b.textContent = label; b.className = cls || '';
    b.dataset.page = target; b.disabled = !!disabled;
    b.title = cls === 'arrow' ? t(target < p ? 'prevPage' : 'nextPage') : t('pageN', { p: target });
    b.onclick = () => flipTo(target); pg.appendChild(b);
  };
  mk('‹', p - 1, 'arrow', p <= 1);
  const set = new Set([1, N]);
  for (let i = p - 2; i <= p + 2; i++) if (i >= 1 && i <= N) set.add(i);
  if (p <= 3) [1, 2, 3, 4, 5].forEach(i => i <= N && set.add(i));
  if (p >= N - 2) [N - 4, N - 3, N - 2, N - 1].forEach(i => i >= 1 && set.add(i));
  let prev = 0;
  [...set].sort((a, b) => a - b).forEach(i => {
    if (i - prev > 1) { const s = document.createElement('span'); s.className = 'dots'; s.textContent = '…'; pg.appendChild(s); }
    mk(String(i), i, i === p ? 'cur' : ''); prev = i;
  });
  mk('›', p + 1, 'arrow', p >= N);
  const sep = document.createElement('span'); sep.className = 'pg-sep';
  const go = document.createElement('input'); go.type = 'number'; go.min = 1; go.max = N; go.className = 'goto'; go.placeholder = t('goPh'); go.title = t('goT');
  go.addEventListener('keydown', ev => { if (ev.key === 'Enter') { goToPage(go.value); go.value = ''; go.blur(); } if (ev.key === 'Escape') go.blur(); });
  const add = document.createElement('button'); add.className = 'pg-tool'; add.textContent = '+'; add.title = t('addPage'); add.onclick = addPage;
  const del = document.createElement('button'); del.className = 'pg-tool del'; del.title = t('deletePage'); del.onclick = deletePage;
  del.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>';
  pg.append(sep, go, add, del);
  $('#layerPage').textContent = t('pageOf', { p, t: N });
}
function goToPage(v) {
  let n = parseInt(v, 10); if (!n) return;
  const N = album().pages;
  if (n > N) { toast(t('onlyN', { n: N })); n = N; }
  n = Math.max(1, n); if (n !== page()) flipTo(n);
}
function addPage() {
  if (flipping) return;
  finishEdit(); pushHistory();
  const a = album(); a.pages++;
  renderPager(); flipTo(a.pages); toast(t('pageAdded', { p: a.pages }));
}
function deletePage() {
  if (flipping) return;
  const a = album(), p = page();
  if (a.pages <= 1) return toast(t('minOnePage'));
  if (pageEls(p).length && !confirm(t('confirmDelPage', { p }))) return;
  finishEdit(); pushHistory();
  a.elements = a.elements.filter(e => e.page !== p);
  a.elements.forEach(e => { if (e.page > p) e.page--; });
  a.pages--; a.page = Math.min(p, a.pages); selectedId = null;
  renderPage(); renderPager(); renderLayers(); renderAlbums(); syncTextControls(); markDirty(); playFlip();
  pageEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  toast(t('pageDeleted', { p }));
}
function cleanClone(node) {
  node.removeAttribute('id');
  node.querySelectorAll('.sel').forEach(n => n.classList.remove('sel'));
  node.querySelectorAll('.editing').forEach(n => n.classList.remove('editing'));
  node.classList.remove('dropping');
  node.querySelectorAll('.brushc,.liveStroke,.selbox').forEach(n => n.remove());
  node.querySelectorAll('.msel').forEach(n => n.classList.remove('msel'));
  return node;
}
function makeFlipper(front) {
  const fl = document.createElement('div'); fl.className = 'flipper';
  front.classList.add('face', 'front');
  const shade = document.createElement('div'); shade.className = 'shade'; front.appendChild(shade);
  const back = document.createElement('div'); back.className = 'page face back';
  fl.append(front, back);
  return { fl, shade };
}
function flipTo(t) {
  t = Number(t);
  if (flipping || !(t >= 1 && t <= album().pages) || t === page()) return false;
  finishEdit(); if (crop) endCrop();
  const dir = t > page() ? 1 : -1;
  flipping = true; playFlip();
  const ease = 'cubic-bezier(.42,.05,.32,1)', dur = 780;
  if (dir > 0) {
    const { fl, shade } = makeFlipper(cleanClone(pageEl.cloneNode(true)));
    album().page = t; renderPage();
    scaler.appendChild(fl);
    fl.animate([{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-115deg)', opacity: 1, offset: .62 }, { transform: 'rotateY(-180deg)', opacity: 0 }], { duration: dur, easing: ease })
      .onfinish = () => { fl.remove(); flipping = false; };
    shade.animate([{ opacity: 0 }, { opacity: .5 }], { duration: dur * .6, fill: 'forwards' });
  } else {
    album().page = t;
    const fresh = document.createElement('div'); fresh.className = 'page'; fillPage(fresh, t);
    const { fl, shade } = makeFlipper(fresh);
    scaler.appendChild(fl);
    fl.animate([{ transform: 'rotateY(-180deg)', opacity: 0 }, { transform: 'rotateY(-115deg)', opacity: 1, offset: .38 }, { transform: 'rotateY(0deg)', opacity: 1 }], { duration: dur, easing: ease })
      .onfinish = () => { renderPage(); fl.remove(); flipping = false; renderLayers(); };
    shade.animate([{ opacity: .5 }, { opacity: 0 }], { duration: dur, fill: 'forwards' });
  }
  if (selectedId && !pageEls(t).some(e => e.id === selectedId)) selectedId = null;
  renderPager(); renderLayers(); syncTextControls(); renderAlbums(); markDirty();
  return true;
}

/* ============ fit book to screen ============ */
function fit() {
  const r = bookArea.getBoundingClientRect();
  S = clamp(Math.min((r.width - 90) / (W + 44), (r.height - 24) / (H + 28)), 0.28, 1.3);
  bookBox.style.width = (W + 44) * S + 'px'; bookBox.style.height = (H + 28) * S + 'px';
  scaler.style.left = 30 * S + 'px'; scaler.style.top = 14 * S + 'px';
  scaler.style.transform = `scale(${S})`;
  document.documentElement.style.setProperty('--inv', (1 / S).toFixed(3));
}

/* ============ pointer: move / resize ============ */
let carryTimer = null, carryDir = 0;
pageEl.addEventListener('pointerdown', ev => {
  if (ev.button !== 0) return;
  if (crop) { if (!ev.target.closest('#cropBox')) endCrop(); return; }
  if (drawTool) {
    if (flipping) return;
    if (editingId) finishEdit();
    ev.preventDefault();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    startStroke(ev); return;
  }
  if (lineMode && !ev.target.closest('.el-line.sel .hd')) {
    if (flipping) return;
    if (editingId) finishEdit();
    ev.preventDefault();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    drag = { mode: 'newline', id: null, A: toPage(ev), sx: ev.clientX, sy: ev.clientY, cx: ev.clientX, cy: ev.clientY, moved: false };
    return;
  }
  const elD = ev.target.closest('.el');
  if (!elD) { if (!editingId && !ev.shiftKey) select(null); return; }
  const id = elD.dataset.id, e = findEl(id);
  if (!e) return;
  const hd = ev.target.closest('.hd');
  if (editingId === id && !hd) return; // typing inside the text frame
  if (flipping) { ev.preventDefault(); return; }
  if (editingId) finishEdit();
  const wasSel = selectedId === id && getSel().length === 1;
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  ev.preventDefault();
  if (ev.shiftKey && !hd) { // Shift+click: add to / remove from the selection
    const cur = getSel(), grp = groupOf(e).map(x => x.id);
    if (cur.includes(id)) { const next = cur.filter(x => !grp.includes(x)); setSel(next, next[next.length - 1], false); return; }
    setSel([...cur, ...grp], id, false);
  } else if (!getSel().includes(id)) setSel([id], id);
  const hitS = !hd && e.type === 'draw' && !ev.shiftKey && getSel().length === 1 ? ev.target.closest('.hit') : null;
  const want = hitS ? { id, i: +hitS.dataset.si } : null;
  if (JSON.stringify(want) !== JSON.stringify(strokeSel)) { const old = strokeSel && findEl(strokeSel.id); strokeSel = want; if (old && old.id !== id) rerenderEl(old); rerenderEl(e); syncDrawControls(); }
  const sel = getSel(), many = !hd && sel.length > 1;
  drag = { id, mode: hd ? (hd.dataset.h === 'rot' ? 'rotate' : 'resize') : 'move', h: hd && hd.dataset.h, sx: ev.clientX, sy: ev.clientY, cx: ev.clientX, cy: ev.clientY,
    ox: e.x, oy: e.y, ow: e.w, oh: e.h, moved: false, wasSel,
    ids: many ? sel.slice() : null, orig: many ? Object.fromEntries(sel.map(i => { const x = findEl(i); return [i, { x: x.x, y: x.y }]; })) : null };
});
pageEl.addEventListener('dblclick', ev => {
  if (lineMode || crop) return;
  const im = ev.target.closest('.el-img');
  if (im) { select(im.dataset.id); startCrop(); return; }
  const elD = ev.target.closest('.el-text'); if (!elD || editingId) return;
  startEdit(elD.dataset.id);
});
window.addEventListener('pointermove', onMove);
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', onUp);

function onMove(ev) {
  if (cropDrag) { cropMove(ev); return; }
  if (!drag) return;
  if (drag.mode === 'stroke' || drag.mode === 'erase') { moveStroke(ev); return; }
  drag.cx = ev.clientX; drag.cy = ev.clientY;
  if (!drag.moved) {
    if (Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < 3) return;
    drag.moved = true; pushHistory(); document.body.classList.add('dragging');
    if (drag.mode === 'newline') {
      const a = album(), dl = state.lineDefaults; a.counters.line = (a.counters.line || 0) + 1;
      const e = { id: uid(), type: 'line', name: 'line' + a.counters.line, page: page(), z: maxZ(page()) + 1,
        color: dl.color, width: dl.width, dash: dl.dash, start: dl.start, end: dl.end };
      setLinePoints(e, drag.A.x, drag.A.y, drag.A.x + 1, drag.A.y);
      a.elements.push(e); drag.id = e.id; drag.h = 'p2';
      selectedId = e.id; pageEl.appendChild(elNode(e)); select(e.id);
    }
  }
  const e = findEl(drag.id); if (!e) return;
  const dx = (ev.clientX - drag.sx) / S, dy = (ev.clientY - drag.sy) / S;
  if (drag.mode === 'move' && drag.ids) {
    moveMany(drag.ids.map(findEl).filter(Boolean), dx, dy, drag.orig);
    checkCarry(ev); hoverTargets(ev); return;
  }
  if (drag.mode === 'move') {
    const p = clampPos(e, drag.ox + dx, drag.oy + dy); e.x = p.x; e.y = p.y;
    checkCarry(ev); hoverTargets(ev);
  } else if (drag.mode === 'rotate') { rotateDrag(e, ev); return; }
  else if (e.type === 'line') { moveLinePoint(e, drag.h, ev); return; }
  else resizeEl(e, dx, dy, ev.shiftKey);
  updateDom(e);
}
function clampPos(e, x, y) {
  if (e.type !== 'line') {
    const { hx, hy } = ext(e), pad = e.type === 'draw' ? (e.pad || 2) * e.w / e.vw : 0;
    let cx = x + e.w / 2, cy = y + e.h / 2;
    cx = hx - pad > W / 2 ? W / 2 : clamp(cx, hx - pad, W - hx + pad);
    cy = hy - pad > H / 2 ? H / 2 : clamp(cy, hy - pad, H - hy + pad);
    return { x: cx - e.w / 2, y: cy - e.h / 2 };
  }
  if (e.type === 'line') {
    return { x: clamp(x, -Math.min(e.ax, e.bx), W - Math.max(e.ax, e.bx)), y: clamp(y, -Math.min(e.ay, e.by), H - Math.max(e.ay, e.by)) };
  }
  return { x: clamp(x, 0, W - e.w), y: clamp(y, 0, H - e.h) };
}
function resizeRect(o, h, dx, dy, B, ratio, minW, minH) {
  const L = h.includes('l'), T = h.includes('t');
  let nw = o.w + (L ? -dx : dx), nh = o.h + (T ? -dy : dy);
  const maxW = L ? o.x + o.w - B.x : B.x + B.w - o.x;
  const maxH = T ? o.y + o.h - B.y : B.y + B.h - o.y;
  if (ratio) {
    if (Math.abs(nh * ratio - o.w) > Math.abs(nw - o.w)) nw = nh * ratio;
    nw = clamp(nw, Math.max(minW, minH * ratio), Math.min(maxW, maxH * ratio)); nh = nw / ratio;
  } else { nw = clamp(nw, minW, maxW); nh = clamp(nh, minH, maxH); }
  return { w: nw, h: nh, x: L ? o.x + o.w - nw : o.x, y: T ? o.y + o.h - nh : o.y };
}
function resizeEl(e, dx, dy, free) {
  const img = e.type === 'img' || e.type === 'draw';
  if (e.rot) { // resize in the element's own (rotated) frame, keep the opposite corner still
    const rr = e.rot * Math.PI / 180, c = Math.cos(rr), sn = Math.sin(rr);
    const o = { x: drag.ox, y: drag.oy, w: drag.ow, h: drag.oh };
    const r = resizeRect(o, drag.h, dx * c + dy * sn, -dx * sn + dy * c, { x: -1e5, y: -1e5, w: 2e5, h: 2e5 }, img && !free ? drag.ow / drag.oh : 0, img ? 16 : 40, img ? 16 : 24);
    const L = drag.h.includes('l'), T = drag.h.includes('t');
    const anchor = q => { const ax = L ? q.w / 2 : -q.w / 2, ay = T ? q.h / 2 : -q.h / 2; return { x: q.x + q.w / 2 + ax * c - ay * sn, y: q.y + q.h / 2 + ax * sn + ay * c }; };
    const a0 = anchor(o), a1 = anchor(r); r.x += a0.x - a1.x; r.y += a0.y - a1.y;
    const { hx, hy } = ext({ w: r.w, h: r.h, rot: e.rot }), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    if (cx - hx < -.5 || cy - hy < -.5 || cx + hx > W + .5 || cy + hy > H + .5) return;
    Object.assign(e, r); return;
  }
  const bx = Math.min(0, drag.ox), by = Math.min(0, drag.oy);
  Object.assign(e, resizeRect({ x: drag.ox, y: drag.oy, w: drag.ow, h: drag.oh }, drag.h, dx, dy, { x: bx, y: by, w: Math.max(W, drag.ox + drag.ow) - bx, h: Math.max(H, drag.oy + drag.oh) - by },
    img && !free ? drag.ow / drag.oh : 0, img ? 16 : 40, img ? 16 : 24));
}
function checkCarry(ev) {
  const r = pageEl.getBoundingClientRect(), sr = bookArea.getBoundingClientRect();
  let dir = 0;
  const inZone = ev.clientX > sr.left && ev.clientX < sr.right && ev.clientY > r.top && ev.clientY < r.bottom;
  if (inZone) { if (ev.clientX > r.right + 8) dir = 1; else if (ev.clientX < r.left - 8) dir = -1; }
  if ((dir === 1 && page() >= album().pages) || (dir === -1 && page() <= 1)) dir = 0;
  if (dir !== carryDir) {
    clearTimeout(carryTimer); carryDir = dir;
    bookBox.classList.toggle('carry-r', dir === 1); bookBox.classList.toggle('carry-l', dir === -1);
    if (dir) carryTimer = setTimeout(() => doCarry(dir), 650);
  }
}
function doCarry(dir) {
  carryDir = 0; bookBox.classList.remove('carry-r', 'carry-l');
  if (!drag || flipping) return;
  const e = findEl(drag.id), t = page() + dir;
  if (!e || t < 1 || t > album().pages) return;
  const els = drag.ids ? drag.ids.map(findEl).filter(Boolean) : [e];
  let z = maxZ(t); els.sort((a, b) => a.z - b.z).forEach(x => { x.z = ++z; x.page = t; });
  flipTo(t);
  drag.ox = e.x; drag.oy = e.y; drag.sx = drag.cx; drag.sy = drag.cy;
  if (drag.orig) els.forEach(x => { drag.orig[x.id] = { x: x.x, y: x.y }; });
  setTimeout(paintSel, 30);
}
function dropTarget(ev) {
  const n = document.elementFromPoint(ev.clientX, ev.clientY); if (!n) return null;
  const pb = n.closest('#pager button[data-page]');
  if (pb && !pb.disabled) return { page: +pb.dataset.page, node: pb };
  const tr = n.closest('#trashBtn'); if (tr) return { trash: true, node: tr };
  return null;
}
function hoverTargets(ev) {
  $$('.drop-hover').forEach(n => n.classList.remove('drop-hover'));
  const t = dropTarget(ev); if (t) t.node.classList.add('drop-hover');
}
function onUp(ev) {
  if (cropDrag) { cropDrag = null; return; }
  if (!drag) return;
  if (drag.mode === 'stroke') { const d = drag; drag = null; commitStroke(d); return; }
  if (drag.mode === 'erase') { drag = null; return; }
  const d = drag; drag = null;
  clearTimeout(carryTimer); carryDir = 0; bookBox.classList.remove('carry-r', 'carry-l');
  document.body.classList.remove('dragging');
  $$('.drop-hover').forEach(n => n.classList.remove('drop-hover'));
  const e = findEl(d.id); if (!e) return;
  if (d.moved) {
    if (d.mode === 'move' && ev.type === 'pointerup') {
      const tg = dropTarget(ev), els = d.ids ? d.ids.map(findEl).filter(Boolean) : [e];
      const label = els.length > 1 ? t('itemsN', { n: els.length }) : e.name;
      if (tg && tg.trash) { els.forEach(x => removeEl(x.id)); markDirty(); toast(t('deleted', { n: label })); return; }
      if (tg && tg.page && tg.page !== e.page) {
        let z = maxZ(tg.page); els.sort((a, b) => a.z - b.z).forEach(x => { x.z = ++z; x.page = tg.page; });
        flipTo(tg.page); toast(t('movedTo', { n: label, p: tg.page }));
      }
    }
    if (e.type === 'text') fitTextHeight(e, true);
    renderLayers(); renderAlbums(); markDirty();
  } else if (e.type === 'text' && d.wasSel && d.mode === 'move') startEdit(e.id);
}

/* ============ text editing ============ */
function startEdit(id, selectAll) {
  const d = domOf(id); if (!d) return;
  if (selectedId !== id) select(id);
  const t = d.querySelector('.txt');
  editingId = id; editBefore = snap();
  d.classList.add('editing');
  try { t.contentEditable = 'plaintext-only'; } catch (_) {}
  if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
  t.focus();
  const r = document.createRange(); r.selectNodeContents(t); if (!selectAll) r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  blurHandler = () => finishEdit();
  t.addEventListener('blur', blurHandler);
  t.oninput = () => { const e = findEl(id); if (e) fitTextHeight(e, false); };
}
function finishEdit() {
  if (!editingId) return;
  const id = editingId; editingId = null;
  const d = domOf(id), e = findEl(id); if (!d || !e) return;
  const t = d.querySelector('.txt');
  t.removeEventListener('blur', blurHandler); t.oninput = null;
  t.contentEditable = 'false'; d.classList.remove('editing');
  t.blur(); try { getSelection().removeAllRanges(); } catch (_) {}
  const txt = t.innerText.replace(/\n+$/, '');
  if (!txt.trim()) { undoStack.push(editBefore); redoStack.length = 0; removeEl(id); }
  else if (txt !== e.text) {
    undoStack.push(editBefore); redoStack.length = 0;
    e.text = txt; t.textContent = txt; fitTextHeight(e, false); renderLayers();
  }
  markDirty();
}
/* grow (or shrink when exact) the text frame so the words fit, staying inside the page */
function fitTextHeight(e, growOnly = true, exact = false) {
  const d = domOf(e.id); if (!d) return;
  const t = d.querySelector('.txt');
  let need;
  if (exact) { const oh = d.style.height; d.style.height = 'auto'; t.style.height = 'auto'; need = t.scrollHeight; d.style.height = oh; t.style.height = ''; }
  else need = t.scrollHeight;
  if (exact || need > e.h) {
    e.h = Math.min(Math.max(24, need), H);
    if (e.y + e.h > H) e.y = Math.max(0, H - e.h);
    updateDom(e);
  }
}
function applyText(patch, tag) {
  Object.assign(state.textDefaults, patch);
  const e = selectedId && findEl(selectedId);
  if (e && e.type === 'text') {
    pushHistory(tag); Object.assign(e, patch);
    const d = domOf(e.id);
    if (d) {
      styleText(d.querySelector('.txt'), e);
      if (patch.size) {
        e.w = Math.min(e.w, W - e.x);
        fitTextHeight(e, false, true);
      } else fitTextHeight(e, true);
    }
  }
  syncTextControls(); markDirty();
}
function syncTextControls() {
  const e = selectedId && findEl(selectedId);
  const src = e && e.type === 'text' ? e : state.textDefaults;
  $('#textTarget').textContent = e && e.type === 'text' ? t('editing', { n: e.name }) : t('newText');
  $$('#sizeChips button').forEach(b => b.classList.toggle('on', +b.dataset.size === src.size));
  const sc = $('#sizeCustom'); if (document.activeElement !== sc) sc.value = src.size;
  $('#textColor').value = src.color;
  $$('.sty:not(.aln)').forEach(b => b.classList.toggle('on', !!src[b.dataset.sty]));
  $$('.sty.aln').forEach(b => b.classList.toggle('on', (src.align || 'left') === b.dataset.al));
  $$('#fontChips button').forEach(b => b.classList.toggle('on', b.dataset.font === src.font));
  syncLineControls(); syncDrawControls();
  const sel = selectedId && findEl(selectedId); $('#cropBtn').disabled = !(sel && sel.type === 'img');
  syncPhotoControls();
}
function addText() {
  finishEdit(); pushHistory();
  const d = state.textDefaults, a = album();
  a.counters.text++;
  const h = Math.round(d.size * LH + PADY * 2 + 2);
  const w = Math.min(W - 40, Math.max(170, d.size * 6));
  const e = { id: uid(), type: 'text', name: 'text' + a.counters.text, page: page(),
    x: Math.round((W - w) / 2), y: Math.round(clamp(H / 2 - h / 2, 0, H - h)), w, h, z: maxZ(page()) + 1,
    text: 'Your text', size: d.size, color: d.color, bold: d.bold, italic: d.italic, underline: d.underline, font: d.font };
  a.elements.push(e); selectedId = e.id;
  renderPage(); renderLayers(); syncTextControls(); renderAlbums();
  startEdit(e.id, true); markDirty();
}

/* ============ add / remove elements ============ */
function readFile(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function getImg(id) { if (imgCache[id]) return imgCache[id]; if (!images[id]) return null; const im = await loadImg(images[id]); imgCache[id] = im; return im; }

function addImageElement(src, im, w, h, cx, cy, sticker) {
  const a = album(); a.counters.img++;
  const imgId = uid(); images[imgId] = src; imgCache[imgId] = im;
  const e = { id: uid(), type: 'img', name: 'img' + a.counters.img, page: page(),
    x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h, z: maxZ(page()) + 1, imgId };
  if (sticker) e.sticker = true;
  a.elements.push(e); selectedId = e.id;
  return e;
}
async function addImages(files, px, py) {
  const list = [...files].filter(f => f.type.startsWith('image/'));
  if (!list.length) return toast(t('chooseImages'));
  finishEdit(); pushHistory();
  let off = 0, scaled = false;
  for (const f of list) {
    try {
      const src = await readFile(f); const im = await loadImg(src);
      let w = im.naturalWidth || 300, h = im.naturalHeight || 300;
      const k = Math.min(1, W / w, H / h); if (k < 1) scaled = true;
      w *= k; h *= k;
      addImageElement(src, im, w, h, (px ?? W / 2) + off, (py ?? H / 2) + off);
      off += 24;
    } catch (err) { toast(t('cantRead', { n: f.name })); }
  }
  renderPage(); renderLayers(); renderAlbums(); syncTextControls(); markDirty();
  if (scaled) toast(t('shrunk'));
}
function removeEl(id) {
  const a = album(); a.elements = a.elements.filter(e => e.id !== id);
  selIds = selIds.filter(x => x !== id); cleanGroups();
  if (selectedId === id) selectedId = null;
  if (editingId === id) editingId = null;
  renderPage(); renderLayers(); renderAlbums(); syncTextControls();
}
function deleteSelected() {
  finishEdit();
  const els = getSel().map(findEl).filter(Boolean);
  if (!els.length) return toast(t('selectFirst'));
  pushHistory(); els.forEach(e => removeEl(e.id)); markDirty(); playPop();
  toast(t('deleted', { n: els.length > 1 ? t('itemsN', { n: els.length }) : els[0].name }));
}
function nudge(dx, dy) {
  const e = selectedId && findEl(selectedId); if (!e) return;
  const sel = getSel();
  if (sel.length > 1) { pushHistory('nudge'); const els = sel.map(findEl).filter(Boolean); moveMany(els, dx, dy, Object.fromEntries(els.map(x => [x.id, { x: x.x, y: x.y }]))); markDirty(); return; }
  pushHistory('nudge');
  const p = clampPos(e, e.x + dx, e.y + dy); e.x = p.x; e.y = p.y;
  updateDom(e); markDirty();
}

/* ============ sticker: background removal + white border ============ */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
/* Background removal:
   1) find the real background colour(s) from the image border, ignoring colours that only
      appear in small parts of the border (that is usually the character touching the edge);
   2) flood-fill inward from the border, but only through pixels close to the background colour
      AND with no sharp colour jump from the previous pixel, so the fill stops at the outline;
   3) if too much would be removed, retry with a stricter tolerance so the subject is never lost. */
function removeBackground(img, w, h) {
  const d = img.data, N = w * h;
  const cd = (r1, g1, b1, r2, g2, b2) => { // weighted RGB distance (closer to how eyes see colour)
    const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) / 3;
  };
  // 1) border colour clusters
  const border = [];
  const addB = p => { const i = p * 4; if (d[i + 3] > 20) border.push(i); };
  for (let x = 0; x < w; x++) { addB(x); addB(w + x < N ? w + x : x); addB((h - 1) * w + x); addB(Math.max(0, h - 2) * w + x); }
  for (let y = 0; y < h; y++) { addB(y * w); addB(y * w + 1); addB(y * w + w - 1); addB(y * w + w - 2); }
  const bins = new Map();
  for (const i of border) {
    const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
    let b = bins.get(k); if (!b) bins.set(k, b = { n: 0, r: 0, g: 0, b: 0, list: [] });
    b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; b.list.push(i);
  }
  // merge neighbouring bins into clusters
  let clusters = [];
  [...bins.values()].sort((a, b) => b.n - a.n).forEach(b => {
    const r = b.r / b.n, g = b.g / b.n, bl = b.b / b.n;
    const c = clusters.find(c => cd(c.r, c.g, c.b, r, g, bl) < 18);
    if (c) { const t = c.n + b.n; c.r = (c.r * c.n + b.r) / t; c.g = (c.g * c.n + b.g) / t; c.b = (c.b * c.n + b.b) / t; c.n = t; c.list.push(...b.list); }
    else clusters.push({ n: b.n, r, g, b: bl, list: [...b.list] });
  });
  const total = Math.max(1, border.length);
  clusters = clusters.filter(c => c.n / total >= 0.12).slice(0, 3); // only colours that really surround the image
  const transparentBorder = border.length < (2 * w + 2 * h) * 0.5;
  if (!clusters.length && !transparentBorder) return 0;
  clusters.forEach(c => { // spread of each background colour → its own tolerance
    let s = 0; for (const i of c.list) s += cd(d[i], d[i + 1], d[i + 2], c.r, c.g, c.b);
    c.tol = clamp(14 + (s / c.list.length) * 2.2, 16, 40);
  });
  const bgDist = i => { let best = 1e9, tol = 0; for (const c of clusters) { const v = cd(d[i], d[i + 1], d[i + 2], c.r, c.g, c.b) / c.tol; if (v < best) { best = v; tol = c.tol; } } return best; };
  const dist = new Float32Array(N);
  for (let p = 0; p < N; p++) dist[p] = d[p * 4 + 3] < 20 ? 0 : (clusters.length ? bgDist(p * 4) : 99);

  const run = k => { // k = strictness multiplier
    const bg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const STEP = 14 * k + 6;
    const ok = (p, from) => {
      if (bg[p] || dist[p] > k) return false;
      if (from < 0) return true;
      const i = p * 4, j = from * 4;
      if (d[i + 3] < 20) return true;
      return cd(d[i], d[i + 1], d[i + 2], d[j], d[j + 1], d[j + 2]) < STEP; // stop at sharp edges (outlines)
    };
    const push = (p, from) => { if (ok(p, from)) { bg[p] = 1; q[qt++] = p; } };
    for (let x = 0; x < w; x++) { push(x, -1); push((h - 1) * w + x, -1); }
    for (let y = 0; y < h; y++) { push(y * w, -1); push(y * w + w - 1, -1); }
    while (qh < qt) {
      const p = q[qh++], x = p % w;
      if (x > 0) push(p - 1, p); if (x < w - 1) push(p + 1, p);
      if (p >= w) push(p - w, p); if (p < N - w) push(p + w, p);
    }
    return { bg, removed: qt / N };
  };
  let res = null;
  for (const k of [1, 0.75, 0.55, 0.4]) { res = run(k); if (res.removed < 0.88) break; }
  if (res.removed >= 0.88) return 0; // could not separate safely → keep the whole image
  const bg = res.bg;
  // 3) apply: background transparent, 1px soft edge only where the edge pixel is close to the background
  for (let p = 0; p < N; p++) if (bg[p]) d[p * 4 + 3] = 0;
  for (let p = 0; p < N; p++) {
    if (bg[p]) continue; const x = p % w;
    const nb = (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (p >= w && bg[p - w]) || (p < N - w && bg[p + w]);
    if (nb && dist[p] < 1.6) d[p * 4 + 3] = Math.round(d[p * 4 + 3] * clamp((dist[p] - 0.6), 0.35, 1));
  }
  return res.removed;
}
async function makeSticker(file) {
  if (!file.type.startsWith('image/')) return toast(t('dropImage'));
  const zone = $('#stickerZone'), hint = $('#stickerHint'), oldHint = hint.textContent;
  zone.classList.add('busy'); hint.textContent = t('removingBg');
  try {
    const src = await readFile(file); const im = await loadImg(src);
    let w = im.naturalWidth || 400, h = im.naturalHeight || 400;
    const k = Math.min(1, 900 / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
    const c = mkCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, w, h);
    await sleep(40);
    const data = x.getImageData(0, 0, w, h);
    const frac = removeBackground(data, w, h);
    x.putImageData(data, 0, 0);
    let minX = w, minY = h, maxX = -1, maxY = -1; const dd = data.data;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (dd[(yy * w + xx) * 4 + 3] > 40) {
      if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
    }
    if (maxX < 0) { toast(t('noSubject')); return; }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const R = Math.max(6, Math.round(Math.max(bw, bh) * 0.028)), PAD = R + 16;
    const cut = mkCanvas(bw, bh); cut.getContext('2d').drawImage(c, minX, minY, bw, bh, 0, 0, bw, bh);
    const sil = mkCanvas(bw, bh), sx = sil.getContext('2d');
    sx.drawImage(cut, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, bw, bh);
    const ow = bw + PAD * 2, oh = bh + PAD * 2;
    const ol = mkCanvas(ow, oh), ox = ol.getContext('2d');
    for (const r of [R, R * 0.66, R * 0.33]) for (let a = 0; a < 360; a += 10) {
      const rad = a * Math.PI / 180; ox.drawImage(sil, PAD + Math.cos(rad) * r, PAD + Math.sin(rad) * r);
    }
    ox.drawImage(cut, PAD, PAD);
    const fin = mkCanvas(ow, oh), fx = fin.getContext('2d');
    fx.shadowColor = 'rgba(90,55,45,.28)'; fx.shadowBlur = 10; fx.shadowOffsetY = 3; fx.drawImage(ol, 0, 0);
    const url = fin.toDataURL('image/png'); const sim = await loadImg(url);
    finishEdit(); pushHistory();
    const kk = Math.min(1, 280 / Math.max(ow, oh));
    addImageElement(url, sim, ow * kk, oh * kk, W / 2, H / 2, true);
    renderPage(); renderLayers(); renderAlbums(); markDirty();
    playTing();
    toast(t(frac < 0.02 ? 'stickerKept' : 'stickerMade'));
  } catch (err) { console.error(err); toast(t('stickerFail')); }
  finally { zone.classList.remove('busy'); hint.textContent = oldHint; }
}

/* ============ layers panel ============ */
function layerRow(e, sub) {
  const sel = getSel();
  const r = document.createElement('div');
  r.className = 'layer' + (sel.includes(e.id) ? ' active' : '') + (sub ? ' sub' : ''); r.draggable = true; r.dataset.id = e.id;
  let th;
  if (e.type === 'img') { th = document.createElement('img'); th.className = 'thumb'; if (images[e.imgId]) th.src = images[e.imgId]; th.alt = ''; }
  else if (e.type === 'draw') { th = document.createElement('span'); th.className = 'thumb t'; th.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 14c3-8 5 4 8-3s4 3 6-2" stroke="${(e.strokes[0] || {}).color || '#5e3f37'}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`; }
  else if (e.type === 'line') { th = document.createElement('span'); th.className = 'thumb t'; th.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 17L17 3" stroke="${e.color}" stroke-width="2.5" stroke-linecap="round"/></svg>`; }
  else { th = document.createElement('span'); th.className = 'thumb t'; th.textContent = 'T'; }
  const nm = document.createElement('span'); nm.className = 'lname'; nm.textContent = e.name;
  const bt = document.createElement('span'); bt.className = 'lbtns';
  bt.innerHTML = `<button data-act="up" title="${t('fwd')}">▲</button><button data-act="down" title="${t('back')}">▼</button>`;
  r.append(th, nm, bt);
  r.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (b) { ev.stopPropagation(); moveLayer(e.id, b.dataset.act === 'up' ? 1 : -1); return; }
    if (r.querySelector('input')) return;
    finishEdit();
    const cur = getSel();
    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { setSel(cur.includes(e.id) ? cur.filter(x => x !== e.id) : [...cur, e.id], e.id, false); return; }
    if (e.id === selectedId && cur.length === 1) renameLayer(r, nm, e); else setSel([e.id], e.id, false);
  });
  layerDnD(r, e.id);
  return r;
}
function groupRow(gid, members) {
  const a = album(), sel = getSel(), all = members.every(m => sel.includes(m.id));
  const r = document.createElement('div'); r.className = 'layer ghead' + (all ? ' active' : ''); r.draggable = true; r.dataset.gid = gid;
  const name = (a.groupNames && a.groupNames[gid]) || 'group';
  r.innerHTML = `<span class="thumb t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7h6l2 2h10v10H3z"/></svg></span><span class="lname"></span><span class="gcount">${members.length}</span>`;
  const nm = r.querySelector('.lname'); nm.textContent = name;
  r.addEventListener('click', () => {
    if (r.querySelector('input')) return;
    finishEdit();
    if (all && sel.length === members.length) { // rename the group
      const inp = document.createElement('input'); inp.value = name; nm.replaceWith(inp); inp.focus(); inp.select(); r.draggable = false;
      let done = false;
      const commit = ok => { if (done) return; done = true; const v = inp.value.trim(); if (ok && v && v !== name) { pushHistory(); a.groupNames = a.groupNames || {}; a.groupNames[gid] = v.slice(0, 40); markDirty(); } renderLayers(); };
      inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') commit(true); if (ev.key === 'Escape') commit(false); });
      inp.addEventListener('blur', () => commit(true)); inp.addEventListener('click', ev => ev.stopPropagation());
    } else setSel(members.map(m => m.id));
  });
  layerDnD(r, 'grp:' + gid);
  return r;
}
function layerDnD(r, key) {
  r.addEventListener('dragstart', ev => { ev.stopPropagation(); layerDrag = key; r.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', key); });
  r.addEventListener('dragend', () => { layerDrag = null; $$('.layer').forEach(n => n.classList.remove('dragging', 'over-top', 'over-bot')); });
  r.addEventListener('dragover', ev => {
    if (!layerDrag) return; ev.preventDefault();
    const rc = r.getBoundingClientRect(), top = ev.clientY < rc.top + rc.height / 2;
    r.classList.toggle('over-top', top); r.classList.toggle('over-bot', !top);
  });
  r.addEventListener('dragleave', () => r.classList.remove('over-top', 'over-bot'));
  r.addEventListener('drop', ev => {
    if (!layerDrag) return; ev.preventDefault();
    const before = r.classList.contains('over-top'), dragKey = layerDrag; layerDrag = null;
    reorderLayer(dragKey, key, before);
  });
}
function renderLayers() {
  const box = $('#layers'); box.innerHTML = '';
  const els = pageEls().sort((a, b) => b.z - a.z);
  if (!els.length) { box.innerHTML = '<div class="empty"></div>'; box.firstChild.textContent = t('noLayers'); return; }
  const done = new Set();
  els.forEach(e => {
    if (done.has(e.id)) return;
    if (e.group) {
      const members = els.filter(x => x.group === e.group);
      box.appendChild(groupRow(e.group, members));
      members.forEach(m => { done.add(m.id); box.appendChild(layerRow(m, true)); });
    } else { done.add(e.id); box.appendChild(layerRow(e, false)); }
  });
}
function renameLayer(row, nm, e) {
  row.draggable = false;
  const inp = document.createElement('input'); inp.value = e.name; nm.replaceWith(inp);
  inp.focus(); inp.select();
  let done = false;
  const commit = ok => {
    if (done) return; done = true;
    const v = inp.value.trim();
    if (ok && v && v !== e.name) { pushHistory(); e.name = v.slice(0, 40); markDirty(); }
    renderLayers();
  };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') commit(true); if (ev.key === 'Escape') commit(false); });
  inp.addEventListener('blur', () => commit(true));
  inp.addEventListener('click', ev => ev.stopPropagation());
}
function applyOrder(listTopFirst) {
  const n = listTopFirst.length;
  listTopFirst.forEach((e, i) => { e.z = n - i; updateDom(e); });
  renderLayers(); markDirty();
}
function moveLayer(id, dir) {
  const list = pageEls().sort((a, b) => b.z - a.z);
  const i = list.findIndex(e => e.id === id), j = i - dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  pushHistory(); [list[i], list[j]] = [list[j], list[i]]; applyOrder(list);
}
function reorderLayer(dragId, targetId, before) {
  if (dragId === targetId) return;
  const list = pageEls().sort((a, b) => b.z - a.z);
  const dg = dragId.startsWith('grp:') ? dragId.slice(4) : null, tg = targetId.startsWith('grp:') ? targetId.slice(4) : null;
  const moving = dg ? list.filter(e => e.group === dg) : list.filter(e => e.id === dragId);
  if (!moving.length) return;
  const rest = list.filter(e => !moving.includes(e));
  let idx;
  if (tg) { const ms = rest.map((e, i) => e.group === tg ? i : -1).filter(i => i >= 0); if (!ms.length) return; idx = before ? ms[0] : ms[ms.length - 1] + 1; }
  else { idx = rest.findIndex(e => e.id === targetId); if (idx < 0) return; if (!before) idx++; }
  rest.splice(idx, 0, ...moving);
  pushHistory(); applyOrder(rest);
}

/* ============ albums panel ============ */
function renderAlbums() {
  const box = $('#albums'); box.innerHTML = '';
  state.albums.forEach(a => {
    const r = document.createElement('div'); r.className = 'album' + (a.id === state.activeAlbumId ? ' active' : '');
    const ic = document.createElement('span'); ic.textContent = '📖';
    const nm = document.createElement('span'); nm.className = 'aname'; nm.textContent = a.name;
    const ct = document.createElement('span'); ct.className = 'acount'; ct.textContent = a.elements.length ? t('items', { n: a.elements.length }) : '';
    r.append(ic, nm, ct);
    if (state.albums.length > 1) {
      const del = document.createElement('button'); del.className = 'adel'; del.title = t('deleteAlbum'); del.textContent = '×';
      del.onclick = ev => { ev.stopPropagation(); deleteAlbum(a); };
      r.appendChild(del);
    }
    r.addEventListener('click', () => { if (!r.querySelector('input')) switchAlbum(a.id); });
    nm.addEventListener('dblclick', ev => { ev.stopPropagation(); renameAlbum(nm, a); });
    box.appendChild(r);
  });
}
function renameAlbum(nm, a) {
  const inp = document.createElement('input'); inp.value = a.name; nm.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  const commit = ok => {
    if (done) return; done = true;
    const v = inp.value.trim();
    if (ok && v && v !== a.name) { pushHistory(); a.name = v.slice(0, 40); markDirty(); }
    renderAlbums(); $('#albumTitle').textContent = album().name;
  };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') commit(true); if (ev.key === 'Escape') commit(false); });
  inp.addEventListener('blur', () => commit(true));
  inp.addEventListener('click', ev => ev.stopPropagation());
}
function switchAlbum(id) {
  if (id === state.activeAlbumId || flipping) return;
  if (crop) endCrop();
  finishEdit(); selectedId = null; state.activeAlbumId = id;
  playFlip(); renderAll(); markDirty();
  pageEl.animate([{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
}
function createAlbum() {
  finishEdit(); pushHistory();
  state.albumCounter = (state.albumCounter || state.albums.length) + 1;
  const a = newAlbum('Album ' + state.albumCounter);
  state.albums.push(a);
  state.activeAlbumId = null; switchAlbum(a.id);
  toast(t('created', { n: a.name }));
}
function deleteAlbum(a) {
  if (!confirm(t('confirmDelAlbum', { n: a.name }))) return;
  pushHistory();
  state.albums = state.albums.filter(x => x.id !== a.id);
  if (state.activeAlbumId === a.id) { state.activeAlbumId = state.albums[0].id; selectedId = null; }
  renderAll(); markDirty(); toast(t('albumDeleted'));
}

/* ============ storage (IndexedDB, per account, on this device) ============ */
let dbp = null;
function db() {
  return dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('diialbum', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('state'); r.result.createObjectStore('images'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
async function idbPut(store, key, val) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(val, key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
async function idbGet(store, key) { const d = await db(); return new Promise((res, rej) => { const r = d.transaction(store).objectStore(store).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

let saveTimer = null;
function markDirty() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 500); setSaved(t('saving')); }
function setSaved(t) { const n = $('#savedState'); if (n) n.textContent = t; }
async function saveNow() {
  clearTimeout(saveTimer); saveTimer = null;
  if (!storageOK || !state) return;
  const key = user || GUEST;
  try {
    await idbPut('state', key, JSON.parse(snapFull()));
    const ids = new Set(); state.albums.forEach(a => a.elements.forEach(e => e.imgId && ids.add(e.imgId))); (state.myStickers || []).forEach(m => ids.add(m.imgId));
    for (const id of ids) { const k = key + '|' + id; if (!savedImgs.has(k) && images[id]) { await idbPut('images', k, images[id]); savedImgs.add(k); } }
    setSaved(t(user ? 'savedDevice' : 'savedGuest'));
  } catch (err) { console.error(err); setSaved(t('saveFail')); }
}
const snapFull = () => JSON.stringify(state);
async function loadUser() {
  const key = user || GUEST; let st = null;
  try { st = await idbGet('state', key); } catch (err) { storageOK = false; console.warn('Storage unavailable', err); }
  state = normalize(st || defaultState());
  state.settings.lang = 'en'; // always start in English; VN can be picked any time
  images = {}; imgCache = {};
  const ids = new Set(); state.albums.forEach(a => a.elements.forEach(e => e.imgId && ids.add(e.imgId))); (state.myStickers || []).forEach(m => ids.add(m.imgId));
  for (const id of ids) { try { const v = await idbGet('images', key + '|' + id); if (v) { images[id] = v; savedImgs.add(key + '|' + id); } } catch (_) {} }
  undoStack = []; redoStack = []; selectedId = null; editingId = null;
  renderAll(); fetchWeather();
  if (!storageOK) toast(t('storageBlocked'));
}

/* ============ accounts (stored locally on this device) ============ */
let authMode = 'in';
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch (_) { return {}; } };
const setUsers = u => { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch (_) {} };
async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ':' + pw);
  if (window.crypto && crypto.subtle) {
    try { const b = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (_) {}
  }
  let h1 = 0x811c9dc5, h2 = 7; for (const c of data) { h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (h2 * 31 + c) >>> 0; }
  return 'f' + h1.toString(16) + h2.toString(16);
}
function renderAuth() {
  const box = $('#auth');
  if (user) {
    const u = getUsers()[user] || { name: user };
    box.innerHTML = `<div class="card-h"><span>${t('account')}</span></div>
      <div class="me"><div class="avatar"></div><div><div class="mename"></div><div class="memail"></div></div></div>
      <div class="saved" id="savedState">${t('savedDevice')}</div>
      <button class="btn ghost" id="logoutBtn">${t('signOut')}</button>`;
    box.querySelector('.avatar').textContent = (u.name || '?').trim().charAt(0).toUpperCase();
    box.querySelector('.mename').textContent = u.name;
    box.querySelector('.memail').textContent = user;
    $('#logoutBtn').onclick = signOut;
  } else {
    const keep = { e: $('#aEmail') ? $('#aEmail').value : '', p: $('#aPw') ? $('#aPw').value : '', n: $('#aName') ? $('#aName').value : '' };
    box.innerHTML = `<div class="card-h"><span>${t('account')}</span></div>
      <div class="tabs"><button data-m="in">${t('signIn')}</button><button data-m="up">${t('signUp')}</button></div>
      <form id="authForm" autocomplete="on">
        <label class="field"><span>${t('gmail')}</span><input type="email" id="aEmail" placeholder="you@gmail.com" required autocomplete="email"></label>
        <label class="field"><span>${t('password')}</span><input type="password" id="aPw" placeholder="${t('pwPh')}" required autocomplete="current-password"></label>
        <label class="field" id="nameField"><span>${t('name')}</span><input type="text" id="aName" placeholder="${t('namePh')}" autocomplete="name"></label>
        <div class="err" id="aErr"></div>
        <button class="btn" type="submit" id="aSubmit"></button>
      </form>
      <div class="saved" id="savedState">${t('guest')}</div>
      <div class="hint">${t('accountHint')}</div>`;
    $('#aEmail').value = keep.e; $('#aPw').value = keep.p; $('#aName').value = keep.n;
    box.querySelectorAll('.tabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.m === authMode);
      b.onclick = () => { authMode = b.dataset.m; renderAuth(); };
    });
    $('#nameField').style.display = authMode === 'up' ? '' : 'none';
    $('#aSubmit').textContent = t(authMode === 'up' ? 'createAccount' : 'signIn');
    $('#authForm').onsubmit = submitAuth;
  }
}
async function submitAuth(ev) {
  ev.preventDefault();
  const email = $('#aEmail').value.trim().toLowerCase(), pw = $('#aPw').value, name = ($('#aName').value || '').trim();
  const err = m => { $('#aErr').textContent = m; };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(t('errEmail'));
  if (pw.length < 6) return err(t('errPw'));
  const users = getUsers();
  if (authMode === 'up') {
    if (!name) return err(t('errName'));
    if (users[email]) return err(t('errExists'));
    const salt = uid();
    users[email] = { name, salt, hash: await hashPw(pw, salt), created: Date.now() };
    setUsers(users);
    finishEdit();
    user = email; localStorage.setItem(SESSION_KEY, email);
    await saveNow(); // current work moves into the new account
    renderAuth(); toast(t('welcome', { n: name }));
  } else {
    const u = users[email];
    if (!u) return err(t('errNoAcc'));
    if (await hashPw(pw, u.salt) !== u.hash) return err(t('errWrongPw'));
    finishEdit(); await saveNow();
    user = email; localStorage.setItem(SESSION_KEY, email);
    await loadUser(); toast(t('welcomeBack', { n: u.name }));
  }
}
async function signOut() {
  finishEdit(); await saveNow();
  user = null; localStorage.removeItem(SESSION_KEY);
  await loadUser(); toast(t('signedOut'));
}

/* ============ sound (Web Audio: music box tune + effects) ============ */
let actx = null, master = null, musicBus = null, sfxBus = null, musicTimer = null, nextT = 0, step = 0, audioUnlocked = false;
const MOODS = { // e = seconds per eighth note
  sunny: { e: .26, inst: 'box', mel: [[76, 79, 84, 79, 76, 72, 74, 76], [74, 79, 83, 79, 74, 71, 72, 74], [72, 76, 81, 76, 72, 69, 71, 72], [69, 72, 77, 76, 74, 72, 74, 0], [76, 79, 84, 86, 84, 79, 76, 79], [83, 79, 74, 79, 83, 86, 83, 79], [81, 77, 72, 77, 79, 74, 71, 74], [72, 76, 79, 84, 0, 0, 0, 0]],
    bass: [[48, 55], [43, 50], [45, 52], [41, 48], [48, 55], [43, 50], [41, 43], [48, 55]] }, // bright morning music box
  cloudy: { e: .34, inst: 'piano', mel: [[65, 69, 72, 69, 67, 69, 65, 0], [64, 67, 72, 67, 65, 64, 62, 0], [62, 65, 69, 65, 64, 62, 60, 0], [60, 62, 64, 65, 67, 0, 0, 0], [65, 69, 72, 74, 72, 69, 67, 0], [70, 69, 67, 65, 64, 67, 65, 0], [62, 65, 69, 67, 65, 64, 62, 64], [65, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[41, 48], [48, 43], [38, 45], [36, 43], [41, 48], [46, 41], [38, 43], [41, 48]] }, // calm, a little grey
  rain: { e: .44, inst: 'piano', mel: [[69, 0, 72, 0, 76, 0, 72, 0], [67, 0, 71, 0, 74, 0, 71, 0], [65, 0, 69, 0, 72, 0, 69, 0], [64, 0, 68, 0, 71, 0, 76, 0], [69, 0, 72, 76, 81, 0, 76, 0], [67, 0, 71, 74, 79, 0, 74, 0], [65, 0, 69, 72, 77, 76, 74, 72], [71, 0, 0, 0, 69, 0, 0, 0]],
    bass: [[45, 52], [43, 50], [41, 48], [40, 47], [45, 52], [43, 50], [41, 48], [40, 45]] }, // slow and sad, A minor
  storm: { e: .2, inst: 'dark', drive: true, mel: [[62, 65, 69, 65, 62, 65, 69, 65], [60, 64, 67, 64, 60, 64, 67, 64], [58, 62, 65, 62, 58, 62, 65, 62], [57, 61, 64, 61, 57, 61, 64, 67], [62, 65, 69, 74, 72, 69, 65, 62], [60, 64, 67, 72, 70, 67, 64, 60], [58, 62, 65, 70, 69, 65, 62, 58], [57, 61, 64, 69, 64, 61, 57, 0]],
    bass: [[38, 45], [36, 43], [34, 41], [33, 40], [38, 45], [36, 43], [34, 41], [33, 45]] }, // fast, driving, D minor
  night: { e: .44, inst: 'celesta', mel: [[79, 0, 74, 0, 71, 0, 74, 0], [76, 0, 72, 0, 69, 0, 72, 0], [74, 0, 71, 0, 67, 0, 71, 74], [72, 0, 0, 0, 71, 0, 0, 0], [79, 0, 83, 0, 81, 0, 79, 0], [76, 0, 79, 0, 74, 0, 72, 0], [71, 0, 72, 0, 74, 0, 69, 0], [67, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[43, 50], [36, 43], [43, 50], [38, 45], [40, 47], [36, 43], [38, 45], [43, 50]] }, // lullaby
  fog: { e: .46, inst: 'pad', mel: [[72, 0, 0, 79, 0, 0, 78, 0], [76, 0, 0, 0, 74, 0, 0, 0], [71, 0, 0, 78, 0, 0, 76, 0], [74, 0, 0, 0, 0, 0, 0, 0], [72, 0, 76, 0, 79, 0, 83, 0], [81, 0, 0, 0, 78, 0, 0, 0], [79, 0, 76, 0, 74, 0, 72, 0], [71, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[36, 43], [38, 45], [35, 42], [38, 45], [36, 43], [33, 40], [36, 43], [35, 42]] }, // hazy and floating
  snow: { e: .38, inst: 'celesta', mel: [[84, 0, 88, 0, 91, 0, 88, 0], [86, 0, 89, 0, 93, 0, 89, 0], [84, 0, 88, 0, 91, 0, 96, 0], [95, 0, 0, 0, 91, 0, 0, 0], [88, 0, 91, 0, 96, 0, 91, 0], [89, 0, 93, 0, 96, 0, 93, 0], [91, 0, 89, 0, 88, 0, 86, 0], [84, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[48, 55], [50, 57], [48, 55], [43, 50], [45, 52], [41, 48], [43, 50], [48, 55]] }, // twinkly snowflakes
  rainbow: { e: .24, inst: 'box', mel: [[67, 71, 74, 79, 74, 71, 67, 71], [72, 76, 79, 84, 79, 76, 72, 76], [71, 74, 79, 83, 79, 74, 71, 74], [69, 72, 76, 81, 79, 76, 74, 72], [67, 71, 74, 79, 81, 83, 84, 0], [76, 74, 72, 71, 72, 74, 76, 79], [74, 72, 71, 69, 71, 72, 74, 71], [67, 0, 79, 0, 67, 0, 0, 0]],
    bass: [[43, 50], [48, 55], [47, 54], [45, 52], [43, 50], [48, 55], [50, 57], [43, 50]] }, // bouncy and playful
  aurora: { e: .5, inst: 'pad', mel: [[74, 0, 81, 0, 78, 0, 76, 0], [73, 0, 0, 0, 76, 0, 81, 0], [74, 0, 79, 0, 83, 0, 81, 0], [78, 0, 0, 0, 0, 0, 0, 0], [86, 0, 85, 0, 81, 0, 78, 0], [79, 0, 83, 0, 86, 0, 85, 0], [81, 0, 78, 0, 76, 0, 73, 0], [74, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[38, 45], [45, 52], [43, 50], [38, 45], [38, 45], [43, 50], [45, 52], [38, 45]], sparkle: true }, // long flowing lines
  sunset: { e: .38, inst: 'piano', mel: [[69, 0, 72, 74, 72, 0, 69, 67], [65, 0, 0, 0, 64, 65, 67, 0], [70, 0, 74, 76, 74, 0, 70, 69], [67, 0, 0, 0, 0, 0, 0, 0], [72, 0, 74, 76, 77, 76, 74, 72], [70, 0, 69, 67, 65, 0, 67, 69], [67, 0, 65, 64, 62, 64, 65, 67], [65, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[41, 48], [45, 52], [46, 53], [48, 55], [45, 52], [46, 53], [43, 50], [41, 48]] }, // warm and a bit nostalgic
  sakura: { e: .36, inst: 'koto', mel: [[69, 0, 70, 0, 74, 0, 76, 74], [77, 0, 76, 0, 74, 0, 70, 0], [69, 0, 74, 0, 76, 0, 81, 0], [77, 0, 76, 74, 70, 0, 69, 0], [81, 0, 82, 0, 81, 0, 77, 76], [74, 0, 76, 0, 77, 0, 76, 74], [70, 0, 69, 0, 64, 0, 65, 0], [69, 0, 0, 0, 0, 0, 0, 0]],
    bass: [[45, 52], [46, 53], [45, 52], [38, 45], [41, 48], [38, 45], [40, 47], [45, 52]] } // Japanese scale, plucked
};
const INST = { // [frequency multiple, loudness, wave, decay seconds]
  box: [[1, .2, 'sine', 1.5], [2, .05, 'sine', .6], [3.01, .025, 'triangle', .5]],
  piano: [[1, .2, 'triangle', 1.9], [2, .045, 'sine', .9], [4, .012, 'sine', .4]],
  dark: [[1, .17, 'triangle', 1.3], [.5, .07, 'sine', 1.3], [2, .03, 'sine', .5]],
  celesta: [[1, .15, 'sine', 2.3], [4, .03, 'sine', .6], [2, .04, 'sine', 1.2]],
  pad: [[1, .11, 'sine', 2.8], [1.5, .03, 'sine', 2], [2, .03, 'sine', 1.6]],
  koto: [[1, .22, 'triangle', .85], [2, .07, 'sine', .35], [4, .02, 'sine', .2]]
};
let moodKey = 'sunny', wantMood = 'sunny', bar = 0;
function musicMoodFor(kind, night, low) { // real weather → tune
  if (kind === 'thunder' || kind === 'storm') return 'storm';
  if (kind === 'rain' || kind === 'heavyrain' || kind === 'drizzle') return 'rain';
  if (kind === 'fog') return 'fog';
  if (night) return 'night';
  if (low && (kind === 'clear' || kind === 'partly')) return 'sunset';
  if (kind === 'overcast' || kind === 'partly') return 'cloudy';
  return 'sunny';
}
function setMusicMood(k) { wantMood = MOODS[k] ? k : 'sunny'; }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    actx = new AC();
    master = actx.createGain(); master.gain.value = 1; master.connect(actx.destination);
    musicBus = actx.createGain(); musicBus.gain.value = 0.32;
    sfxBus = actx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    // soft echo for the music box
    const dl = actx.createDelay(); dl.delayTime.value = 0.27;
    const fb = actx.createGain(); fb.gain.value = 0.28;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    musicBus.connect(master); musicBus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
  }
  if (actx.state === 'suspended') actx.resume();
  return true;
}
function playNote(m, t, inst) {
  const f = mtof(m), atk = inst === 'pad' ? .28 : .006;
  INST[inst].forEach(([mul, amp, type, dec]) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = f * mul;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + atk + dec + .1);
  });
}
function bassNote(m, t) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'triangle'; o.frequency.value = mtof(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 1.2);
}
const MINOR = { rain: 1, storm: 1, sakura: 1 };
function playBridge(t0, key) { // a sparkly harp run in the new key, so the change sounds intentional
  const M = MOODS[key], root = M.bass[0][0] + 24, iv = MINOR[key] ? [0, 3, 7, 12, 15, 19, 24] : [0, 4, 7, 12, 16, 19, 24];
  iv.forEach((d, i) => playNote(root + d, t0 + i * .075, 'celesta'));
  playNote(root + 24, t0 + iv.length * .075 + .05, 'box');
  if (actx) { // soft swell: dip the old tune, bring the new one in
    const g = musicBus.gain; g.cancelScheduledValues(t0 - .3); g.setValueAtTime(g.value, t0 - .3);
    g.linearRampToValueAtTime(.16, t0); g.linearRampToValueAtTime(.32, t0 + .9);
    const src = actx.createBufferSource(); src.buffer = noiseBuf(.8); // airy whoosh
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(500, t0); bp.frequency.exponentialRampToValueAtTime(4200, t0 + .6);
    const ng = actx.createGain(); ng.gain.setValueAtTime(.0001, t0); ng.gain.linearRampToValueAtTime(.05, t0 + .25); ng.gain.exponentialRampToValueAtTime(.0001, t0 + .75);
    src.connect(bp); bp.connect(ng); ng.connect(musicBus); src.start(t0); src.stop(t0 + .8);
  }
  return iv.length * .075 + .45; // time the bridge takes
}
function driveNote(m, t) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'triangle'; o.frequency.value = mtof(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.25);
}
function scheduleMusic() {
  while (nextT < actx.currentTime + 0.45) {
    const i = step % 8;
    if (wantMood !== moodKey && i % 2 === 0) { // change on the next beat, with a little bridge
      nextT += playBridge(nextT, wantMood);
      moodKey = wantMood; bar = 0; step = 0;
      continue;
    }
    const M = MOODS[moodKey], b = bar % 8, n = M.mel[b][i];
    if (n) playNote(n, nextT, M.inst);
    if (i === 0) bassNote(M.bass[b][0], nextT);
    if (i === 4) bassNote(M.bass[b][1], nextT);
    if (M.drive && i % 2 === 1) driveNote(M.bass[b][i < 4 ? 0 : 1] + 12, nextT); // storm: pulsing eighths
    if (M.sparkle && i % 4 === 2 && Math.random() < .6) playNote(M.mel[b][0] ? M.mel[b][0] + 24 : 86, nextT, 'celesta'); // aurora: high shimmer
    nextT += M.e; step++; if (step % 8 === 0) bar++;
  }
}
function startMusic() {
  if (musicTimer || !audioUnlocked || !ensureAudio()) return;
  musicBus.gain.cancelScheduledValues(actx.currentTime);
  musicBus.gain.setValueAtTime(0.0001, actx.currentTime); musicBus.gain.linearRampToValueAtTime(0.32, actx.currentTime + 1.2);
  nextT = actx.currentTime + 0.1; step = 0; bar = 0; moodKey = wantMood;
  musicTimer = setInterval(scheduleMusic, 100); scheduleMusic();
}
function stopMusic() {
  if (!musicTimer) return; clearInterval(musicTimer); musicTimer = null;
  if (actx) { musicBus.gain.cancelScheduledValues(actx.currentTime); musicBus.gain.setValueAtTime(musicBus.gain.value, actx.currentTime); musicBus.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.3); }
}
const sfxOn = () => state && state.settings.sound && audioUnlocked && ensureAudio();
function noiseBuf(sec) { const b = actx.createBuffer(1, actx.sampleRate * sec, actx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function playFlip() {
  if (!sfxOn()) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource(); src.buffer = noiseBuf(0.7);
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.32); bp.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55, t + 0.08); g.gain.linearRampToValueAtTime(0.3, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
  src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + 0.7);
  const s2 = actx.createBufferSource(); s2.buffer = noiseBuf(0.12);
  const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
  const g2 = actx.createGain(); g2.gain.setValueAtTime(0.0001, t + 0.55); g2.gain.linearRampToValueAtTime(0.25, t + 0.56); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.66);
  s2.connect(hp); hp.connect(g2); g2.connect(sfxBus); s2.start(t + 0.55); s2.stop(t + 0.7);
}
function playTing() {
  if (!sfxOn()) return;
  const t = actx.currentTime;
  [[1975.5, 0.28, 0, 1.6], [2959.9, 0.12, 0, 1.0], [2637, 0.18, 0.11, 1.4]].forEach(([f, a, dt, dur]) => {
    const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + dt); g.gain.linearRampToValueAtTime(a, t + dt + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + dur);
    o.connect(g); g.connect(sfxBus); o.start(t + dt); o.stop(t + dt + dur + 0.05);
  });
}
function playPop() {
  if (!sfxOn()) return;
  const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.15);
  g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2);
}
function unlockAudio() {
  if (audioUnlocked) return; audioUnlocked = true;
  if (state && state.settings.sound) startMusic();
}
function setSound(on) {
  state.settings.sound = on;
  if (on) { if (audioUnlocked) startMusic(); } else stopMusic();
  applySettings(); markDirty();
}
function toggleSound() { setSound(!state.settings.sound); toast(t(state.settings.sound ? 'soundOn' : 'soundOff')); }

/* ============ settings ============ */
const ICON = {
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>'
};
function applySettings() {
  syncWeatherControls();
  document.body.classList.toggle('dark', state.settings.theme === 'dark');
  if (Sky.ready) updateWeather();
  const sb = $('#soundBtn'), tb = $('#themeBtn');
  sb.innerHTML = state.settings.sound ? ICON.soundOn : ICON.soundOff; sb.classList.toggle('off', !state.settings.sound);
  sb.title = t(state.settings.sound ? 'soundOnT' : 'soundOffT');
  tb.innerHTML = state.settings.theme === 'dark' ? ICON.moon : ICON.sun;
  tb.title = t(state.settings.theme === 'dark' ? 'darkT' : 'lightT');
  if (state.settings.sound) { if (audioUnlocked && !musicTimer) startMusic(); } else stopMusic();
}

/* ============ export ============ */
function textFont(e) { return `${e.italic ? 'italic ' : ''}${e.bold ? '700' : '400'} ${e.size}px ${FONTS[e.font] ? FONTS[e.font].css : FONTS.classic.css}`; }
const measureCtx = document.createElement('canvas').getContext('2d');
function wrapLines(e) {
  const ctx = measureCtx; ctx.font = textFont(e);
  const maxW = Math.max(4, e.w - PADX * 2), out = [];
  for (const para of e.text.split('\n')) {
    const words = para.split(' '); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxW) { line = test; continue; }
      if (line) out.push(line);
      if (ctx.measureText(w).width > maxW) {
        let chunk = '';
        for (const ch of w) { if (ctx.measureText(chunk + ch).width > maxW && chunk) { out.push(chunk); chunk = ch; } else chunk += ch; }
        line = chunk;
      } else line = w;
    }
    out.push(line);
  }
  return out;
}
async function loadFontsFor(els) {
  try { await document.fonts.ready; for (const e of els) if (e.type === 'text') await document.fonts.load(textFont(e), e.text); } catch (_) {}
}
async function renderCanvas(a, p, scale) {
  const els = pageEls(p, a).sort((x, y) => x.z - y.z);
  await loadFontsFor(els);
  const c = mkCanvas(W * scale, H * scale), ctx = c.getContext('2d');
  ctx.scale(scale, scale); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  for (const e of els) {
    const rr = e.type !== 'line' && e.rot;
    if (rr) { ctx.save(); ctx.translate(e.x + e.w / 2, e.y + e.h / 2); ctx.rotate(e.rot * Math.PI / 180); ctx.translate(-(e.x + e.w / 2), -(e.y + e.h / 2)); }
    if (e.type === 'draw') {
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.w / e.vw, e.h / e.vh); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const st of e.strokes) for (const L of strokeLayers(st)) {
        ctx.save(); if (L.tx) ctx.translate(L.tx, L.ty);
        ctx.globalAlpha = L.a; ctx.strokeStyle = st.color; ctx.lineWidth = L.w; ctx.lineCap = L.cap; ctx.setLineDash(L.dash ? L.dash.split(' ').map(Number) : []);
        ctx.stroke(new Path2D(L.d)); ctx.restore();
      }
      ctx.restore();
    }
    else if (e.type === 'line') {
      ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = e.color; ctx.strokeStyle = e.color; ctx.lineJoin = 'round';
      for (const part of lineParts(e)) {
        const path = new Path2D(part.d);
        if (part.fill) ctx.fill(path);
        if (part.stroke) { ctx.lineWidth = part.sw; ctx.lineCap = part.cap || 'butt'; ctx.setLineDash(part.dash ? part.dash.split(' ').map(Number) : []); ctx.stroke(path); }
      }
      ctx.restore();
    }
    else if (e.type === 'img') { const im = await getImg(e.imgId); if (im) drawPhoto(ctx, e, im, scale); }
    else {
      ctx.save(); ctx.beginPath(); ctx.rect(e.x, e.y, e.w, e.h); ctx.clip();
      ctx.font = textFont(e); ctx.fillStyle = e.color; ctx.textBaseline = 'middle';
      const lh = e.size * LH;
      const al = e.align || 'left'; ctx.textAlign = al;
      const ax = al === 'center' ? e.x + e.w / 2 : al === 'right' ? e.x + e.w - PADX : e.x + PADX;
      wrapLines(e).forEach((ln, i) => {
        const y = e.y + PADY + lh * (i + 0.5), x = ax;
        ctx.fillText(ln, x, y);
        if (e.underline && ln) { const w = ctx.measureText(ln).width, ux = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x; ctx.fillRect(ux, y + e.size * 0.42, w, Math.max(1, e.size / 15)); }
      });
      ctx.restore();
    }
    if (rr) ctx.restore();
  }
  return c;
}
async function renderSVG(a, p) {
  const els = pageEls(p, a).sort((x, y) => x.z - y.z);
  await loadFontsFor(els);
  const fontUrl = $('#fontLink').href;
  let defs = '', body = '';
  els.forEach((e, k) => {
    const b0 = body.length;
    if (e.type === 'draw') body += `<g transform="translate(${e.x} ${e.y}) scale(${e.w / e.vw} ${e.h / e.vh})">${strokesSVG(e)}</g>`;
    else if (e.type === 'line') body += `<g transform="translate(${e.x} ${e.y})">${lineSVG(e)}</g>`;
    else if (e.type === 'img') { if (images[e.imgId]) { const ps = photoSVG(e, k); defs += ps.defs; body += ps.body; } }
    else {
      defs += `<clipPath id="c${k}"><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}"/></clipPath>`;
      const lh = e.size * LH;
      const al = e.align || 'left', ax = al === 'center' ? e.x + e.w / 2 : al === 'right' ? e.x + e.w - PADX : e.x + PADX;
      const spans = wrapLines(e).map((ln, i) => `<tspan x="${ax}" y="${(e.y + PADY + lh * (i + 0.5)).toFixed(2)}">${esc(ln) || ' '}</tspan>`).join('');
      body += `<g clip-path="url(#c${k})"><text xml:space="preserve" dominant-baseline="middle" text-anchor="${al === 'center' ? 'middle' : al === 'right' ? 'end' : 'start'}" font-family="${esc(FONTS[e.font] ? FONTS[e.font].css : FONTS.classic.css)}" font-size="${e.size}" font-weight="${e.bold ? 700 : 400}" font-style="${e.italic ? 'italic' : 'normal'}" fill="${e.color}"${e.underline ? ' text-decoration="underline"' : ''}>${spans}</text></g>`;
    }
    if (e.rot && e.type !== 'line') body = body.slice(0, b0) + `<g transform="rotate(${e.rot} ${e.x + e.w / 2} ${e.y + e.h / 2})">` + body.slice(b0) + '</g>';
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><style>@import url('${esc(fontUrl)}');</style>${defs}</defs><rect width="${W}" height="${H}" fill="#ffffff"/>${body}</svg>`;
}
function dataURLToBytes(url) { const b = atob(url.split(',')[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function makePDF(imgs) {
  const enc = new TextEncoder(), chunks = [], offs = []; let len = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
  const obj = (i, body) => { offs[i] = len; add(i + ' 0 obj\n'); (Array.isArray(body) ? body : [body]).forEach(add); add('\nendobj\n'); };
  add('%PDF-1.4\n'); add(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const n = imgs.length, total = 2 + 3 * n;
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${imgs.map((_, k) => (3 + 3 * k) + ' 0 R').join(' ')}] /Count ${n} >>`);
  imgs.forEach((im, k) => {
    const p = 3 + 3 * k, c = p + 1, x = p + 2, content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${x} 0 R >> >> /Contents ${c} 0 R >>`);
    obj(c, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    obj(x, [`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, '\nendstream']);
  });
  const xref = len;
  let s = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= total; i++) s += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  s += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  add(s);
  return new Blob(chunks, { type: 'application/pdf' });
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function exportNow() {
  finishEdit();
  const scope = $('#expScope').value, fmt = $('#expFmt').value, a = album();
  const pages = scope === 'page' ? [page()] : [...new Set(a.elements.map(e => e.page))].sort((x, y) => x - y);
  if (!pages.length) return toast(t('emptyAlbum'));
  const base = (a.name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'album').replace(/\s+/g, '-');
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  // whole album as images: put them in a folder. Ask where first, while the click still counts as a user action.
  let dirRoot = null;
  const asFolder = scope === 'album' && fmt !== 'pdf';
  if (asFolder && window.showDirectoryPicker) {
    try { dirRoot = await window.showDirectoryPicker({ id: 'diialbum-export', mode: 'readwrite' }); }
    catch (err) { if (err && err.name === 'AbortError') return toast(t('exportCancel')); dirRoot = null; }
  }
  const btn = $('#exportBtn'); btn.disabled = true; btn.textContent = t('preparing');
  try {
    if (fmt === 'pdf') {
      const imgs = [];
      for (const p of pages) { const c = await renderCanvas(a, p, 2); imgs.push({ bytes: dataURLToBytes(c.toDataURL('image/jpeg', 0.92)), w: c.width, h: c.height }); }
      download(makePDF(imgs), scope === 'page' ? `${base}-page-${pages[0]}.pdf` : `${base}.pdf`);
      toast(t('downloaded'));
      return;
    }
    const files = [];
    for (const p of pages) {
      let blob;
      if (fmt === 'svg') blob = new Blob([await renderSVG(a, p)], { type: 'image/svg+xml' });
      else { const c = await renderCanvas(a, p, 2); blob = await new Promise(r => c.toBlob(r, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92)); }
      files.push({ name: `page-${String(p).padStart(2, '0')}.${ext}`, blob });
    }
    if (!asFolder) { download(files[0].blob, `${base}-page-${pages[0]}.${ext}`); toast(t('downloaded')); return; }
    if (dirRoot) {
      const dir = await dirRoot.getDirectoryHandle(base, { create: true });
      for (const f of files) { const fh = await dir.getFileHandle(f.name, { create: true }), wr = await fh.createWritable(); await wr.write(f.blob); await wr.close(); }
      toast(t('exportFolder', { n: files.length, f: base }));
    } else {
      const zfiles = [];
      for (const f of files) zfiles.push({ name: `${base}/${f.name}`, data: new Uint8Array(await f.blob.arrayBuffer()) });
      download(makeZip(zfiles), `${base}.zip`);
      toast(t('exportZip', { n: files.length, f: base }));
    }
  } catch (err) { console.error(err); toast(t('exportFail', { n: err.message })); }
  finally { btn.disabled = false; btn.textContent = '⬇ ' + t('download'); }
}

/* ============ toast ============ */
let toastTimer = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }

/* ============ UI bindings ============ */
function bindUI() {
  const lsg = $('#langSeg');
  LANGS.forEach(([k, label]) => { const b = document.createElement('button'); b.dataset.l = k; b.textContent = label; b.onclick = () => { state.settings.lang = k; renderAll(); markDirty(); }; lsg.appendChild(b); });
  $('#newAlbum').onclick = createAlbum;
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#addText').onclick = addText;
  $('#trashBtn').onclick = deleteSelected;
  $('#exportBtn').onclick = exportNow;
  $('#soundBtn').onclick = () => { unlockAudio(); toggleSound(); };
  $('#themeBtn').onclick = () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; applySettings(); markDirty(); };
  $$('#sizeChips button').forEach(b => b.onclick = () => applyText({ size: +b.dataset.size }));
  const sc = $('#sizeCustom');
  const applyCustom = () => { const v = Math.round(+sc.value); if (v >= 6 && v <= 300) applyText({ size: v }, 'size'); else syncTextControls(); };
  sc.addEventListener('change', applyCustom);
  sc.addEventListener('keydown', ev => { if (ev.key === 'Enter') { applyCustom(); sc.blur(); } });
  $('#textColor').addEventListener('input', ev => applyText({ color: ev.target.value }, 'color'));
  $$('.sty.aln').forEach(b => b.onclick = () => applyText({ align: b.dataset.al }));
  $$('.sty:not(.aln)').forEach(b => b.onclick = () => {
    const e = selectedId && findEl(selectedId); const src = e && e.type === 'text' ? e : state.textDefaults;
    applyText({ [b.dataset.sty]: !src[b.dataset.sty] });
  });
  const fc = $('#fontChips');
  Object.entries(FONTS).forEach(([k, f]) => {
    const b = document.createElement('button'); b.dataset.font = k;
    b.innerHTML = `<span class="fs" style="font-family:${f.css.replace(/"/g, '')}">Aa Love</span><span class="fl">${f.label}</span>`;
    b.onclick = () => applyText({ font: k }); fc.appendChild(b);
  });
  // photos
  const pi = $('#photoInput');
  $('#addPhoto').onclick = () => pi.click();
  pi.onchange = () => { addImages(pi.files); pi.value = ''; };
  const hasFiles = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes('Files');
  const hasPal = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes('application/x-dii');
  const stage = $('#stage');
  stage.addEventListener('dragover', ev => { if (hasPal(ev)) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; return; } if (!hasFiles(ev)) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; pageEl.classList.add('dropping'); });
  stage.addEventListener('dragleave', ev => { if (!stage.contains(ev.relatedTarget)) pageEl.classList.remove('dropping'); });
  stage.addEventListener('drop', ev => {
    if (hasPal(ev)) {
      ev.preventDefault(); const r = pageEl.getBoundingClientRect();
      try { const o = JSON.parse(ev.dataTransfer.getData('application/x-dii')); addPaletteItem(o.kind, o.key, clamp((ev.clientX - r.left) / S, 0, W), clamp((ev.clientY - r.top) / S, 0, H)); } catch (_) {}
      return;
    }
    if (!hasFiles(ev)) return; ev.preventDefault(); pageEl.classList.remove('dropping');
    const r = pageEl.getBoundingClientRect();
    addImages(ev.dataTransfer.files, clamp((ev.clientX - r.left) / S, 0, W), clamp((ev.clientY - r.top) / S, 0, H));
  });
  // stickers
  const sz = $('#stickerZone'), si = $('#stickerInput');
  sz.onclick = () => si.click();
  si.onchange = async () => { for (const f of [...si.files]) await makeSticker(f); si.value = ''; };
  sz.addEventListener('dragover', ev => { if (!hasFiles(ev)) return; ev.preventDefault(); sz.classList.add('over'); });
  sz.addEventListener('dragleave', () => sz.classList.remove('over'));
  sz.addEventListener('drop', async ev => { if (!hasFiles(ev)) return; ev.preventDefault(); sz.classList.remove('over'); for (const f of [...ev.dataTransfer.files]) await makeSticker(f); });
  // stop the browser from opening files dropped elsewhere
  window.addEventListener('dragover', ev => { if (hasFiles(ev)) ev.preventDefault(); });
  window.addEventListener('drop', ev => { if (hasFiles(ev)) ev.preventDefault(); });
  // audio unlock on first interaction
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  // keyboard shortcuts
  document.addEventListener('keydown', ev => {
    const tg = ev.target, typing = tg.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tg.tagName);
    const k = ev.key.toLowerCase();
    const kc = ev.code && ev.code.startsWith('Key') ? ev.code.slice(3).toLowerCase() : k; // physical key
    if (crop) {
      if (ev.key === 'Enter') { ev.preventDefault(); applyCrop(); }
      else if (ev.key === 'Escape') endCrop();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && kc === 'z') { if (typing) return; ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && kc === 'y') { if (typing) return; ev.preventDefault(); redo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && kc === 'a') { if (typing) return; ev.preventDefault(); selectAll(); return; }
    if ((ev.ctrlKey || ev.metaKey) && kc === 'g') { if (typing) return; ev.preventDefault(); ev.shiftKey ? ungroupSelected() : groupSelected(); return; }
    if (ev.key === 'Escape') hideCtx();
    if (typing) { if (ev.key === 'Escape' && editingId) finishEdit(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (k === 'delete' || k === 'x') { ev.preventDefault(); deleteSelected(); }
    else if (k === 'm') toggleSound();
    else if (k === 'w') { ev.preventDefault(); nudge(0, -1); }
    else if (k === 's') { ev.preventDefault(); nudge(0, 1); }
    else if (k === 'a') { ev.preventDefault(); nudge(-1, 0); }
    else if (k === 'd') { ev.preventDefault(); nudge(1, 0); }
    else if (ev.key === 'ArrowLeft') flipTo(page() - 1);
    else if (ev.key === 'ArrowRight') flipTo(page() + 1);
    else if (k === 'r') { ev.preventDefault(); rotateSelected(ev.shiftKey ? -15 : 15); }
    else if (k === 'l') setLineMode(!lineMode);
    else if (k === 'b') setDrawTool('pen');
    else if (k === 'e') setDrawTool('eraser');
    else if (k === 'c') startCrop();
    else if (ev.key === 'Escape') { if (drawTool) setDrawTool(null); else if (lineMode) setLineMode(false); else select(null); }
  });
  new ResizeObserver(fit).observe(bookArea);
  bindExtras(); bindPhotoStyle(); bindMulti();
  const rp = $('.panel.right'), qk = $('.quick');
  rp.addEventListener('scroll', () => qk.classList.toggle('stuck', rp.scrollTop > 4));
  $('#stkMake').onclick = createNamedSticker;
  $('#stkName').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); createNamedSticker(); } });
  window.addEventListener('resize', fit);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  window.addEventListener('beforeunload', () => { if (saveTimer) saveNow(); });
}

/* ============ lines ============ */
let lineMode = false;
const f2 = n => Math.round(n * 100) / 100;
const CAPS = ['none', 'round', 'arrow', 'triangle', 'open', 'dot', 'circle', 'square', 'diamond', 'bar'];
const CAP_LABEL = { none: 'Flat', round: 'Round', arrow: 'Arrow', triangle: 'Triangle', open: 'Open arrow', dot: 'Dot', circle: 'Ring', square: 'Square', diamond: 'Diamond', bar: 'Bar' };
function toPage(ev) { const r = pageEl.getBoundingClientRect(); return { x: (ev.clientX - r.left) / S, y: (ev.clientY - r.top) / S }; }
const linePad = e => e.width * 3 + 16;
function setLinePoints(e, ax, ay, bx, by) {
  const pad = linePad(e);
  e.x = Math.min(ax, bx) - pad; e.y = Math.min(ay, by) - pad;
  e.w = Math.abs(bx - ax) + pad * 2; e.h = Math.abs(by - ay) + pad * 2;
  e.ax = ax - e.x; e.ay = ay - e.y; e.bx = bx - e.x; e.by = by - e.y;
}
const lineAbs = (e, which) => which === 'a' ? { x: e.x + e.ax, y: e.y + e.ay } : { x: e.x + e.bx, y: e.y + e.by };
function circPath(c, r) { return `M${f2(c.x - r)} ${f2(c.y)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z`; }
function capParts(kind, P, u, s) {
  const n = { x: -u.y, y: u.x };
  const pt = (a, b) => `${f2(P.x + u.x * a + n.x * b)} ${f2(P.y + u.y * a + n.y * b)}`;
  switch (kind) {
    case 'round': return { inset: 0, parts: [{ d: circPath(P, s / 2), fill: true }] };
    case 'dot': { const r = s * 1.5 + 3; return { inset: 0, parts: [{ d: circPath(P, r), fill: true }] }; }
    case 'circle': { const r = s * 1.5 + 4; const c = { x: P.x - u.x * r, y: P.y - u.y * r }; return { inset: r * 2, parts: [{ d: circPath(c, r), stroke: true, sw: s }] }; }
    case 'arrow': { const L = s * 2.8 + 9, hw = s * 1.6 + 5; return { inset: L * 0.68, parts: [{ d: `M${pt(0, 0)}L${pt(-L, hw)}L${pt(-L * 0.72, 0)}L${pt(-L, -hw)}Z`, fill: true }] }; }
    case 'triangle': { const L = s * 2.6 + 8, hw = s * 1.5 + 5; return { inset: L * 0.9, parts: [{ d: `M${pt(0, 0)}L${pt(-L, hw)}L${pt(-L, -hw)}Z`, fill: true }] }; }
    case 'open': { const L = s * 2.4 + 8, hw = s * 1.6 + 5; return { inset: s * 0.5, parts: [{ d: `M${pt(-L, hw)}L${pt(0, 0)}L${pt(-L, -hw)}`, stroke: true, sw: s, cap: 'round' }] }; }
    case 'square': { const q = s * 1.3 + 4; return { inset: 0, parts: [{ d: `M${pt(q, q)}L${pt(q, -q)}L${pt(-q, -q)}L${pt(-q, q)}Z`, fill: true }] }; }
    case 'diamond': { const q = s * 1.7 + 5; return { inset: 0, parts: [{ d: `M${pt(q, 0)}L${pt(0, q)}L${pt(-q, 0)}L${pt(0, -q)}Z`, fill: true }] }; }
    case 'bar': { const q = s * 1.8 + 5; return { inset: 0, parts: [{ d: `M${pt(0, q)}L${pt(0, -q)}`, stroke: true, sw: s, cap: 'round' }] }; }
    default: return { inset: 0, parts: [] };
  }
}
function lineParts(e, A = { x: e.ax, y: e.ay }, B = { x: e.bx, y: e.by }) {
  const s = e.width, out = [];
  const len = Math.hypot(B.x - A.x, B.y - A.y) || 0.0001;
  const uB = { x: (B.x - A.x) / len, y: (B.y - A.y) / len }, uA = { x: -uB.x, y: -uB.y };
  const ca = capParts(e.start, A, uA, s), cb = capParts(e.end, B, uB, s);
  if (len > ca.inset + cb.inset + 0.5) {
    const a2 = { x: A.x - uA.x * ca.inset, y: A.y - uA.y * ca.inset }, b2 = { x: B.x - uB.x * cb.inset, y: B.y - uB.y * cb.inset };
    const dash = e.dash === 'dashed' ? `${f2(s * 3)} ${f2(s * 2.2)}` : e.dash === 'dotted' ? `0.01 ${f2(s * 2)}` : '';
    out.push({ d: `M${f2(a2.x)} ${f2(a2.y)}L${f2(b2.x)} ${f2(b2.y)}`, stroke: true, sw: s, cap: e.dash === 'dotted' ? 'round' : 'butt', dash });
  }
  out.push(...ca.parts, ...cb.parts);
  return out;
}
function lineSVG(e, A, B) {
  return lineParts(e, A, B).map(p => `<path d="${p.d}" fill="${p.fill ? e.color : 'none'}"${p.stroke ? ` stroke="${e.color}" stroke-width="${p.sw}" stroke-linecap="${p.cap || 'butt'}" stroke-linejoin="round"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}` : ''}/>`).join('');
}
function rerenderEl(e) { const old = domOf(e.id); if (old) old.replaceWith(elNode(e)); }
function moveLinePoint(e, which, ev) {
  const pt = toPage(ev);
  const other = lineAbs(e, which === 'p1' ? 'b' : 'a');
  let x = clamp(pt.x, 0, W), y = clamp(pt.y, 0, H);
  if (ev.shiftKey) {
    const a = Math.round(Math.atan2(y - other.y, x - other.x) / (Math.PI / 4)) * (Math.PI / 4);
    const L = Math.hypot(x - other.x, y - other.y);
    x = clamp(other.x + Math.cos(a) * L, 0, W); y = clamp(other.y + Math.sin(a) * L, 0, H);
  }
  if (which === 'p1') setLinePoints(e, x, y, other.x, other.y); else setLinePoints(e, other.x, other.y, x, y);
  rerenderEl(e);
}
function setLineMode(v) {
  if (v && crop) endCrop();
  if (v && drawTool) setDrawTool(null);
  lineMode = !!v; if (lineMode) finishEdit();
  document.body.classList.toggle('linemode', lineMode);
  const b = $('#lineBtn'); b.classList.toggle('on', lineMode);
  b.textContent = '✎ ' + t(lineMode ? 'drawingLine' : 'drawLine');
}
function applyLine(patch, tag) {
  Object.assign(state.lineDefaults, patch);
  const e = selectedId && findEl(selectedId);
  if (e && e.type === 'line') {
    pushHistory(tag);
    const A = lineAbs(e, 'a'), B = lineAbs(e, 'b');
    Object.assign(e, patch); setLinePoints(e, A.x, A.y, B.x, B.y); rerenderEl(e);
    if (patch.color) renderLayers();
  }
  syncLineControls(); markDirty();
}
function capIcon(kind, flip) {
  const fake = { width: 2.5, color: 'currentColor', dash: 'solid', start: 'none', end: kind };
  const A = flip ? { x: 34, y: 9 } : { x: 4, y: 9 }, B = flip ? { x: 6, y: 9 } : { x: 32, y: 9 };
  return `<svg viewBox="0 0 38 18">${lineSVG(fake, A, B)}</svg>`;
}
function syncLineControls() {
  const e = selectedId && findEl(selectedId);
  const src = e && e.type === 'line' ? e : state.lineDefaults;
  $('#lineTarget').textContent = e && e.type === 'line' ? t('editing', { n: e.name }) : t('newLine');
  $('#lineColor').value = src.color; $('#lineWidth').value = src.width; $('#lineWidthVal').textContent = src.width;
  $$('#lineDash button').forEach(b => b.classList.toggle('on', b.dataset.v === src.dash));
  $$('#capStart button').forEach(b => b.classList.toggle('on', b.dataset.cap === src.start));
  $$('#capEnd button').forEach(b => b.classList.toggle('on', b.dataset.cap === src.end));
}

/* ============ crop ============ */
let crop = null, cropDrag = null;
function startCrop() {
  finishEdit(); if (lineMode) setLineMode(false); if (drawTool) setDrawTool(null);
  const e = getSel().length === 1 && findEl(selectedId);
  if (!e || e.type !== 'img') return toast(t('selectPhotoCrop'));
  if (!images[e.imgId]) return toast(t('photoMissing'));
  if (crop) endCrop();
  crop = { id: e.id, x: e.x, y: e.y, w: e.w, h: e.h, ratio: 0 };
  const b = document.createElement('div'); b.id = 'cropBox';
  b.innerHTML = '<div class="ch tl" data-h="tl"></div><div class="ch tr" data-h="tr"></div><div class="ch bl" data-h="bl"></div><div class="ch br" data-h="br"></div>';
  b.addEventListener('pointerdown', ev => {
    ev.stopPropagation(); ev.preventDefault();
    const h = ev.target.closest('.ch');
    cropDrag = { h: h && h.dataset.h, sx: ev.clientX, sy: ev.clientY, o: { x: crop.x, y: crop.y, w: crop.w, h: crop.h } };
  });
  b.addEventListener('dblclick', ev => { ev.stopPropagation(); applyCrop(); });
  pageEl.appendChild(b); placeCrop();
  $$('#cropBar [data-r]').forEach(x => x.classList.toggle('on', x.dataset.r === '0'));
  $('#cropBar').classList.add('show');
  toast(t('cropHelp'));
}
function placeCrop() {
  const b = $('#cropBox'); if (!b) return;
  b.style.left = crop.x + 'px'; b.style.top = crop.y + 'px'; b.style.width = crop.w + 'px'; b.style.height = crop.h + 'px';
  const e = findEl(crop.id), r = (e && e.rot) || 0;
  b.style.transformOrigin = e ? `${e.x + e.w / 2 - crop.x}px ${e.y + e.h / 2 - crop.y}px` : '';
  b.style.transform = r ? `rotate(${r}deg)` : '';
}
function cropBounds() { const e = findEl(crop.id); return { x: e.x, y: e.y, w: e.w, h: e.h }; }
function cropMove(ev) {
  if (!crop) { cropDrag = null; return; }
  const B = cropBounds(), o = cropDrag.o, e0 = findEl(crop.id), rr = ((e0 && e0.rot) || 0) * Math.PI / 180;
  const gx = (ev.clientX - cropDrag.sx) / S, gy = (ev.clientY - cropDrag.sy) / S;
  const dx = gx * Math.cos(rr) + gy * Math.sin(rr), dy = -gx * Math.sin(rr) + gy * Math.cos(rr);
  if (!cropDrag.h) { crop.x = clamp(o.x + dx, B.x, B.x + B.w - crop.w); crop.y = clamp(o.y + dy, B.y, B.y + B.h - crop.h); }
  else Object.assign(crop, resizeRect(o, cropDrag.h, dx, dy, B, crop.ratio, 12, 12));
  placeCrop();
}
function setCropRatio(r) {
  if (!crop) return;
  crop.ratio = r;
  $$('#cropBar [data-r]').forEach(x => x.classList.toggle('on', +x.dataset.r === r));
  if (!r) return;
  const B = cropBounds(), cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2;
  let w = Math.min(B.w, B.h * r) * 0.92, h = w / r;
  crop.w = w; crop.h = h;
  crop.x = clamp(cx - w / 2, B.x, B.x + B.w - w); crop.y = clamp(cy - h / 2, B.y, B.y + B.h - h);
  placeCrop();
}
function endCrop() {
  const b = $('#cropBox'); if (b) b.remove();
  $('#cropBar').classList.remove('show'); crop = null; cropDrag = null;
}
async function applyCrop() {
  if (!crop) return;
  const e = findEl(crop.id); if (!e) return endCrop();
  const c0 = { ...crop };
  if (Math.abs(c0.w - e.w) < 0.5 && Math.abs(c0.h - e.h) < 0.5) { endCrop(); return; }
  try {
    const src = images[e.imgId], im = await getImg(e.imgId);
    const nw = im.naturalWidth || e.w, nh = im.naturalHeight || e.h, fx = nw / e.w, fy = nh / e.h;
    const isSvg = src.startsWith('data:image/svg'), k = isSvg ? 4 : 1;
    const sx = (c0.x - e.x) * fx, sy = (c0.y - e.y) * fy, sw = c0.w * fx, sh = c0.h * fy;
    const c = mkCanvas(sw * k, sh * k);
    c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
    const url = src.startsWith('data:image/jpeg') ? c.toDataURL('image/jpeg', 0.95) : c.toDataURL('image/png');
    const nim = await loadImg(url);
    pushHistory();
    const id = uid(); images[id] = url; imgCache[id] = nim;
    const rr = (e.rot || 0) * Math.PI / 180, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, vx = c0.x + c0.w / 2 - ecx, vy = c0.y + c0.h / 2 - ecy;
    const ncx = ecx + vx * Math.cos(rr) - vy * Math.sin(rr), ncy = ecy + vx * Math.sin(rr) + vy * Math.cos(rr);
    e.imgId = id; e.w = c0.w; e.h = c0.h; e.x = ncx - c0.w / 2; e.y = ncy - c0.h / 2;
    const pp = clampPos(e, e.x, e.y); e.x = pp.x; e.y = pp.y;
    endCrop(); renderPage(); renderLayers(); markDirty(); toast(t('cropped'));
  } catch (err) { console.error(err); endCrop(); toast(t('cropFail')); }
}

/* ============ photo styles: colour looks + frames ============ */
const I4 = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
function mMul(a, b) { // apply b, then a (4x5 colour matrices)
  const o = new Array(20);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    let v = c === 4 ? a[r * 5 + 4] : 0;
    for (let k = 0; k < 4; k++) v += a[r * 5 + k] * b[k * 5 + c];
    o[r * 5 + c] = v;
  }
  return o;
}
const chain = (...ms) => ms.reduce((acc, m) => mMul(m, acc), I4);
const mixM = (m, a) => I4.map((v, i) => v + (m[i] - v) * a);
const GRAY = [.2126, .7152, .0722, 0, 0, .2126, .7152, .0722, 0, 0, .2126, .7152, .0722, 0, 0, 0, 0, 0, 1, 0];
const SEPIA = [.393, .769, .189, 0, 0, .349, .686, .168, 0, 0, .272, .534, .131, 0, 0, 0, 0, 0, 1, 0];
const satM = s => { const r = .2126, g = .7152, b = .0722; return [r + (1 - r) * s, g - g * s, b - b * s, 0, 0, r - r * s, g + (1 - g) * s, b - b * s, 0, 0, r - r * s, g - g * s, b + (1 - b) * s, 0, 0, 0, 0, 0, 1, 0]; };
const briM = b => [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
const conM = c => [c, 0, 0, 0, (1 - c) / 2, 0, c, 0, 0, (1 - c) / 2, 0, 0, c, 0, (1 - c) / 2, 0, 0, 0, 1, 0];
const tintM = (r, g, b, or, og, ob) => [r, 0, 0, 0, or, 0, g, 0, 0, og, 0, 0, b, 0, ob, 0, 0, 0, 1, 0];
const FX = {
  none: I4,
  bw: chain(GRAY, conM(1.08)),
  warm: chain(satM(1.08), tintM(1.08, 1.01, .86, .02, .01, 0)),
  cool: chain(satM(.95), tintM(.9, .99, 1.1, 0, .01, .04)),
  vintage: chain(mixM(SEPIA, .55), conM(.88), tintM(1.03, 1, .92, .04, .03, .02)),
  fade: chain(satM(.75), conM(.78), briM(1.04)),
  vivid: chain(satM(1.45), conM(1.08)),
  rosy: chain(tintM(1.06, .97, 1, .04, 0, .03), satM(1.05)),
  noir: chain(GRAY, conM(1.45), briM(.96)),
  dreamy: chain(satM(.85), conM(.88), briM(1.07), tintM(1.03, .99, 1.02, .03, .02, .04))
};
const FRAMES = ['none', 'rounded', 'circle', 'white', 'polaroid', 'shadow'];
function tintMatrix(hex) { // re-colour: every pixel takes the chosen colour at its own brightness
  const c = hexRgb(/^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#c4836f').map(v => v / 255);
  const Lc = Math.max(.08, .2126 * c[0] + .7152 * c[1] + .0722 * c[2]);
  const row = i => { const k = c[i] / Lc; return [k * .2126, k * .7152, k * .0722, 0, 0]; };
  return [...row(0), ...row(1), ...row(2), 0, 0, 0, 1, 0];
}
const fxMatrix = e => mixM(e.fx === 'tint' ? tintMatrix(e.tint) : (FX[e.fx] || I4), (e.fxAmt ?? 100) / 100);
const hasFx = e => e.fx && e.fx !== 'none' && (e.fxAmt ?? 100) > 0;
function ensureFx(id, m) {
  const NS = 'http://www.w3.org/2000/svg';
  let f = document.getElementById(id);
  if (!f) {
    f = document.createElementNS(NS, 'filter'); f.id = id; f.setAttribute('color-interpolation-filters', 'sRGB');
    const cm = document.createElementNS(NS, 'feColorMatrix'); cm.setAttribute('type', 'matrix'); f.appendChild(cm);
    $('#fxDefs').appendChild(f);
  }
  f.firstChild.setAttribute('values', m.map(v => +v.toFixed(4)).join(' '));
}
function fxCss(e) { if (!hasFx(e)) return ''; ensureFx('fx-' + e.id, fxMatrix(e)); return `url(#fx-${e.id})`; }
function photoRect(e) { // where the picture sits inside its frame
  const m = Math.min(e.w, e.h), fr = e.frame || 'none';
  if (fr === 'white') { const p = .04 * m; return { x: e.x + p, y: e.y + p, w: e.w - 2 * p, h: e.h - 2 * p, cover: true }; }
  if (fr === 'polaroid') { const p = .05 * m; return { x: e.x + p, y: e.y + p, w: e.w - 2 * p, h: e.h - .27 * m, cover: true }; }
  return { x: e.x, y: e.y, w: e.w, h: e.h, cover: false };
}
function coverSrc(im, w, h) {
  const nw = im.naturalWidth || im.width, nh = im.naturalHeight || im.height, sa = nw / nh, da = w / h;
  if (sa > da) { const sw = nh * da; return [(nw - sw) / 2, 0, sw, nh]; }
  const sh = nw / da; return [0, (nh - sh) / 2, nw, sh];
}
function photoCanvas(e, im, r, scale) { // picture (cover-cropped, colour-styled) as a canvas
  const k = Math.min(scale, 4000 / Math.max(r.w, r.h));
  const c = mkCanvas(r.w * k, r.h * k), x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  if (r.cover) x.drawImage(im, ...coverSrc(im, r.w, r.h), 0, 0, c.width, c.height); else x.drawImage(im, 0, 0, c.width, c.height);
  if (hasFx(e)) {
    const m = fxMatrix(e), d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const R = p[i] / 255, G = p[i + 1] / 255, B = p[i + 2] / 255, A = p[i + 3] / 255;
      p[i] = 255 * (m[0] * R + m[1] * G + m[2] * B + m[3] * A + m[4]);
      p[i + 1] = 255 * (m[5] * R + m[6] * G + m[7] * B + m[8] * A + m[9]);
      p[i + 2] = 255 * (m[10] * R + m[11] * G + m[12] * B + m[13] * A + m[14]);
    }
    x.putImageData(d, 0, 0);
  }
  return c;
}
function rrPath(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawPhoto(ctx, e, im, scale) {
  const fr = e.frame || 'none', m = Math.min(e.w, e.h), r = photoRect(e);
  if (fr === 'white' || fr === 'polaroid') {
    ctx.save(); ctx.shadowColor = 'rgba(90,60,50,.22)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; ctx.fillStyle = '#fff'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.restore();
  }
  const pc = photoCanvas(e, im, r, scale);
  ctx.save();
  if (fr === 'rounded') { rrPath(ctx, r.x, r.y, r.w, r.h, .09 * m); ctx.clip(); }
  if (fr === 'circle') { ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, 6.29); ctx.clip(); }
  if (fr === 'shadow') { ctx.shadowColor = 'rgba(80,50,40,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; }
  ctx.drawImage(pc, r.x, r.y, r.w, r.h);
  ctx.restore();
}
function photoSVG(e, k) {
  const fr = e.frame || 'none', m = Math.min(e.w, e.h), r = photoRect(e), src = images[e.imgId];
  let defs = '', body = '';
  if (fr === 'white' || fr === 'polaroid') {
    defs += `<filter id="sh${k}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#5a3c32" flood-opacity=".22"/></filter>`;
    body += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="#ffffff" filter="url(#sh${k})"/>`;
  }
  let clip = '', filt = '';
  if (fr === 'rounded') { defs += `<clipPath id="cl${k}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${.09 * m}"/></clipPath>`; clip = ` clip-path="url(#cl${k})"`; }
  if (fr === 'circle') { defs += `<clipPath id="cl${k}"><ellipse cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2}" rx="${r.w / 2}" ry="${r.h / 2}"/></clipPath>`; clip = ` clip-path="url(#cl${k})"`; }
  if (hasFx(e)) { defs += `<filter id="fx${k}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${fxMatrix(e).map(v => +v.toFixed(4)).join(' ')}"/></filter>`; filt = ` filter="url(#fx${k})"`; }
  let img = `<image x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="${r.cover ? 'xMidYMid slice' : 'none'}" href="${src}" xlink:href="${src}"${filt}/>`;
  if (clip) img = `<g${clip}>${img}</g>`;
  if (fr === 'shadow') { defs += `<filter id="sd${k}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#503228" flood-opacity=".35"/></filter>`; img = `<g filter="url(#sd${k})">${img}</g>`; }
  return { defs, body: body + img };
}
const SAMPLE_PHOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc9ef"/><stop offset="1" stop-color="#ffd7b5"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="58" cy="24" r="10" fill="#ffd36b"/><path d="M0 62q20-14 40 0t40 0v18H0z" fill="#86b77a"/><path d="M0 70q24-10 48 0t32 0v10H0z" fill="#e88f86"/></svg>');
let fxThumbSrc = '';
function selectedPhoto() { const e = selectedId && findEl(selectedId); return e && e.type === 'img' ? e : null; }
function syncPhotoControls() {
  const e = selectedPhoto(), on = !!e;
  $('#photoStyle').classList.toggle('off', !on);
  $('#fxHint').style.display = on ? 'none' : '';
  const src = on && images[e.imgId] ? images[e.imgId] : SAMPLE_PHOTO;
  if (src !== fxThumbSrc) { fxThumbSrc = src; $$('#fxGrid img').forEach(i => { i.src = src; }); }
  $$('#fxGrid button').forEach(b => b.classList.toggle('on', on && (e.fx || 'none') === b.dataset.fx));
  $$('#frameGrid button').forEach(b => b.classList.toggle('on', on && (e.frame || 'none') === b.dataset.fr));
  const amt = on ? (e.fxAmt ?? 100) : 100;
  $('#fxAmt').value = amt; $('#fxAmtVal').textContent = amt;
  const tint = on && e.fx === 'tint';
  $('.chgcolor').classList.toggle('on', tint);
  if (document.activeElement !== $('#tintColor')) $('#tintColor').value = on && e.tint ? e.tint : '#c4836f';
}
function applyPhoto(patch, tag) {
  const e = selectedPhoto(); if (!e) return toast(t('selectPhotoStyle'));
  pushHistory(tag); Object.assign(e, patch);
  if ('fxAmt' in patch && Object.keys(patch).length === 1) { const im = domOf(e.id) && domOf(e.id).querySelector('img'); if (im) im.style.filter = fxCss(e); }
  else rerenderEl(e);
  syncPhotoControls(); markDirty();
}
function bindPhotoStyle() {
  const NS = 'http://www.w3.org/2000/svg';
  Object.entries(FX).forEach(([k, m]) => ensureFx('fxp-' + k, m));
  const g = $('#fxGrid');
  Object.keys(FX).forEach(k => {
    const b = document.createElement('button'); b.dataset.fx = k;
    b.innerHTML = `<img alt="" style="filter:url(#fxp-${k})"><span data-i18n="fx_${k}"></span>`;
    b.onclick = () => applyPhoto({ fx: k }); g.appendChild(b);
  });
  const ICONS = {
    none: '<rect x="5" y="7" width="22" height="18" fill="#cbb3aa"/>',
    rounded: '<rect x="5" y="7" width="22" height="18" rx="5" fill="#cbb3aa"/>',
    circle: '<ellipse cx="16" cy="16" rx="10" ry="10" fill="#cbb3aa"/>',
    white: '<rect x="4" y="6" width="24" height="20" fill="#fff" stroke="#e2d2cb"/><rect x="7" y="9" width="18" height="14" fill="#cbb3aa"/>',
    polaroid: '<rect x="6" y="3" width="20" height="26" fill="#fff" stroke="#e2d2cb"/><rect x="8.5" y="5.5" width="15" height="15" fill="#cbb3aa"/>',
    shadow: '<rect x="8" y="10" width="20" height="17" fill="#a88d84" opacity=".35"/><rect x="5" y="7" width="20" height="17" fill="#cbb3aa"/>'
  };
  const fg = $('#frameGrid');
  FRAMES.forEach(k => {
    const b = document.createElement('button'); b.dataset.fr = k; b.setAttribute('data-i18n-title', 'frame_' + k);
    b.innerHTML = `<svg viewBox="0 0 32 32">${ICONS[k]}</svg>`;
    b.onclick = () => applyPhoto({ frame: k }); fg.appendChild(b);
  });
  const tc = $('#tintColor');
  tc.addEventListener('input', () => { const e = selectedPhoto(); applyPhoto(e && e.fx !== 'tint' ? { fx: 'tint', tint: tc.value, fxAmt: 70 } : { fx: 'tint', tint: tc.value }, 'tint'); });
  $('#tintOff').onclick = () => applyPhoto({ fx: 'none' });
  $('#fxAmt').addEventListener('input', ev => { $('#fxAmtVal').textContent = ev.target.value; applyPhoto({ fxAmt: +ev.target.value }, 'fxamt'); });
}

/* ============ make-your-own stickers (type a name) ============ */
function dieCut(src, R) { // trim, add a white sticker edge and a soft shadow
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  if (maxX < 0) return src;
  const bw = maxX - minX + 1, bh = maxY - minY + 1, PAD = R + 16;
  const cut = mkCanvas(bw, bh); cut.getContext('2d').drawImage(src, minX, minY, bw, bh, 0, 0, bw, bh);
  const sil = mkCanvas(bw, bh), sx = sil.getContext('2d');
  sx.drawImage(cut, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, bw, bh);
  const ol = mkCanvas(bw + PAD * 2, bh + PAD * 2), ox = ol.getContext('2d');
  for (const r of [R, R * .66, R * .33]) for (let a = 0; a < 360; a += 10) { const rad = a * Math.PI / 180; ox.drawImage(sil, PAD + Math.cos(rad) * r, PAD + Math.sin(rad) * r); }
  ox.drawImage(cut, PAD, PAD);
  const fin = mkCanvas(ol.width, ol.height), fx = fin.getContext('2d');
  fx.shadowColor = 'rgba(90,55,45,.28)'; fx.shadowBlur = 10; fx.shadowOffsetY = 3; fx.drawImage(ol, 0, 0);
  return fin;
}
async function textStickerCanvas(text) {
  const COLS = [['#f48ea0', '#d4627a'], ['#ffb547', '#df8b14'], ['#7fb3e6', '#4d8bc9'], ['#8cc777', '#5c9a49'], ['#b19be0', '#8869c6'], ['#c4836f', '#9a5c49']];
  const [fill, edge] = COLS[Math.floor(Math.random() * COLS.length)];
  const font = s => `900 ${s}px Nunito, "Arial Rounded MT Bold", system-ui, sans-serif`;
  let size = 96;
  try { await document.fonts.load(font(size), text); } catch (_) {}
  const mx = measureCtx; mx.font = font(size);
  let tw = mx.measureText(text).width;
  if (tw > 900) { size = Math.max(36, size * 900 / tw); mx.font = font(size); tw = mx.measureText(text).width; }
  const c = mkCanvas(tw + 60, size * 1.6), x = c.getContext('2d'), cx = c.width / 2, cy = c.height / 2;
  x.font = font(size); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.lineWidth = size * .13; x.strokeStyle = edge; x.strokeText(text, cx, cy);
  x.fillStyle = fill; x.fillText(text, cx, cy);
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, cy - size * .55, 0, cy); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, c.width, cy);
  return dieCut(c, Math.round(size * .15));
}
/* ============ smart sticker maker: understands objects, colours, counts, size, mood ============ */
const EMO_DATA = [ // [emoji, English words, Vietnamese phrases (with accents)]
  ['🐱', 'cat kitty kitten', 'mèo, mèo con, miu'], ['🐶', 'dog puppy doggy', 'chó, cún, chó con, cún con'], ['🐰', 'rabbit bunny', 'thỏ'], ['🐻', 'bear', 'gấu'], ['🧸', 'teddy', 'gấu bông'],
  ['🐼', 'panda', 'gấu trúc'], ['🐨', 'koala', 'koala, gấu túi'], ['🦊', 'fox', 'cáo'], ['🐥', 'chick', 'gà con'], ['🐔', 'chicken hen rooster', 'gà'], ['🐷', 'pig piggy', 'heo, lợn'],
  ['🐮', 'cow', 'bò, bò sữa'], ['🐸', 'frog', 'ếch'], ['🐟', 'fish', 'cá'], ['🐠', 'tropical', 'cá cảnh, cá nhiệt đới'], ['🐳', 'whale', 'cá voi'], ['🐬', 'dolphin', 'cá heo'], ['🦈', 'shark', 'cá mập'],
  ['🐢', 'turtle', 'rùa'], ['🦋', 'butterfly', 'bướm'], ['🐝', 'bee', 'ong'], ['🦄', 'unicorn', 'kỳ lân'], ['🦖', 'dinosaur dino', 'khủng long'], ['🐲', 'dragon', 'rồng'], ['🦆', 'duck', 'vịt'],
  ['🐧', 'penguin', 'chim cánh cụt'], ['🐦', 'bird', 'chim'], ['🦉', 'owl', 'cú, cú mèo'], ['🦜', 'parrot', 'vẹt'], ['🦩', 'flamingo', 'hồng hạc'], ['🕊️', 'dove pigeon', 'bồ câu, chim bồ câu'],
  ['🐭', 'mouse', 'chuột'], ['🐹', 'hamster', 'hamster, chuột hamster'], ['🐿️', 'squirrel', 'sóc'], ['🦔', 'hedgehog', 'nhím'], ['🦦', 'otter', 'rái cá'], ['🦥', 'sloth', 'con lười'],
  ['🐯', 'tiger', 'hổ, cọp'], ['🦁', 'lion', 'sư tử'], ['🐵', 'monkey', 'khỉ'], ['🐘', 'elephant', 'voi'], ['🦒', 'giraffe', 'hươu cao cổ'], ['🦓', 'zebra', 'ngựa vằn'], ['🦌', 'deer', 'hươu, nai'],
  ['🐑', 'sheep lamb', 'cừu'], ['🐐', 'goat', 'dê'], ['🐴', 'horse pony', 'ngựa'], ['🐊', 'crocodile', 'cá sấu'], ['🐍', 'snake', 'rắn'], ['🐌', 'snail', 'ốc sên'], ['🐞', 'ladybug', 'bọ rùa'],
  ['🐙', 'octopus', 'bạch tuộc'], ['🦀', 'crab', 'cua'], ['🦐', 'shrimp prawn', 'tôm'], ['👻', 'ghost', 'ma, con ma'], ['👽', 'alien', 'người ngoài hành tinh'], ['🤖', 'robot', 'robot, người máy'],
  ['🌸', 'flower blossom sakura', 'hoa, bông hoa, hoa anh đào, hoa đào'], ['🌹', 'rose', 'hoa hồng'], ['🌷', 'tulip', 'hoa tulip'], ['🌻', 'sunflower', 'hoa hướng dương, hướng dương'],
  ['🌼', 'daisy', 'hoa cúc'], ['🌺', 'hibiscus', 'hoa dâm bụt, dâm bụt'], ['💐', 'bouquet', 'bó hoa'], ['🪷', 'lotus', 'hoa sen, sen'], ['🌵', 'cactus', 'xương rồng'],
  ['🌳', 'tree', 'cây, cây xanh, cái cây'], ['🌲', 'pine', 'cây thông, thông'], ['🌴', 'palm', 'cây dừa'], ['🌱', 'sprout seedling', 'mầm, cây non, mầm cây'], ['🪴', 'plant houseplant', 'chậu cây, cây cảnh'],
  ['🍃', 'leaf leaves', 'lá, lá cây'], ['🍁', 'maple autumn', 'lá phong, mùa thu'], ['🍀', 'clover lucky luck', 'may mắn, cỏ bốn lá'], ['🍄', 'mushroom', 'nấm'],
  ['☀️', 'sun sunny', 'mặt trời, nắng, trời nắng'], ['🌙', 'moon', 'trăng, mặt trăng'], ['⭐', 'star', 'ngôi sao, sao'], ['☁️', 'cloud', 'mây, đám mây'], ['🌧️', 'rain rainy', 'mưa, trời mưa'],
  ['⚡', 'lightning thunder', 'sét, tia chớp'], ['🌈', 'rainbow', 'cầu vồng'], ['❄️', 'snow snowflake', 'tuyết, bông tuyết'], ['⛄', 'snowman', 'người tuyết'], ['🔥', 'fire flame', 'lửa'],
  ['🏖️', 'beach', 'biển, bãi biển'], ['🌊', 'wave sea ocean', 'sóng, sóng biển'], ['⛰️', 'mountain', 'núi, ngọn núi'], ['🌋', 'volcano', 'núi lửa'], ['🏝️', 'island', 'đảo, hòn đảo'],
  ['🪐', 'planet saturn', 'hành tinh'], ['🌍', 'earth world globe', 'trái đất, thế giới'], ['🚀', 'rocket', 'tên lửa'], ['☂️', 'umbrella', 'ô, dù, cái ô'],
  ['❤️', 'heart love', 'tim, trái tim, tình yêu'], ['💖', 'sparkleheart', 'tim lấp lánh'], ['💋', 'kiss', 'hôn, nụ hôn'], ['💍', 'ring wedding', 'nhẫn, đám cưới'], ['💌', 'loveletter', 'thư tình'],
  ['✉️', 'letter mail envelope', 'thư, lá thư, phong bì'], ['🎁', 'gift present', 'quà, món quà, quà tặng, hộp quà'], ['🎂', 'cake birthday', 'bánh kem, sinh nhật, bánh sinh nhật'], ['🍰', 'cakeslice', 'bánh ngọt, miếng bánh'],
  ['🧁', 'cupcake muffin', 'bánh cupcake'], ['🎉', 'party celebrate', 'tiệc, bữa tiệc, chúc mừng'], ['🎈', 'balloon', 'bóng bay'], ['🎀', 'bow ribbon', 'nơ, cái nơ'], ['👑', 'crown princess queen king', 'vương miện, công chúa'],
  ['💎', 'diamond gem', 'kim cương, đá quý'], ['📷', 'camera photo', 'máy ảnh, chụp ảnh'], ['🎵', 'music song note', 'nhạc, âm nhạc, bài hát, nốt nhạc'], ['🎸', 'guitar', 'đàn guitar, ghi ta, cây đàn'],
  ['🎹', 'piano keyboard', 'đàn piano, piano'], ['🎤', 'microphone mic karaoke', 'micro, hát'], ['🎧', 'headphones', 'tai nghe'], ['🎨', 'art paint palette', 'vẽ, hội họa, bảng màu'], ['🖌️', 'brush', 'cọ vẽ'],
  ['📚', 'book books', 'sách, quyển sách'], ['✏️', 'pencil', 'bút chì, cây bút'], ['🎒', 'backpack bag', 'balo, cặp sách'], ['👗', 'dress', 'váy, đầm'], ['👕', 'shirt tshirt', 'áo, áo thun'],
  ['👟', 'shoe shoes sneaker', 'giày'], ['👒', 'hat', 'mũ, nón'], ['👓', 'glasses', 'kính, mắt kính'], ['💄', 'lipstick makeup', 'son, son môi'], ['👜', 'handbag purse', 'túi xách'],
  ['⏰', 'clock alarm time', 'đồng hồ'], ['💡', 'idea bulb lamp', 'ý tưởng, bóng đèn'], ['🔑', 'key', 'chìa khóa'], ['✈️', 'plane airplane flight', 'máy bay'], ['🚗', 'car', 'xe hơi, ô tô, xe'],
  ['🚲', 'bike bicycle', 'xe đạp'], ['🛵', 'motorbike scooter', 'xe máy'], ['🚌', 'bus', 'xe buýt'], ['🚕', 'taxi', 'taxi'], ['🚒', 'firetruck', 'xe cứu hỏa'], ['🚆', 'train', 'tàu, tàu hỏa'],
  ['⛵', 'boat ship sailboat', 'thuyền, con thuyền'], ['🏠', 'house home', 'nhà, ngôi nhà'], ['🏰', 'castle palace', 'lâu đài'], ['🏫', 'school', 'trường, trường học'], ['⛺', 'tent camping', 'lều, cắm trại'],
  ['🎡', 'ferriswheel', 'đu quay, vòng quay'], ['☕', 'coffee cafe latte', 'cà phê, cafe'], ['🍵', 'tea matcha', 'trà, trà xanh'], ['🧋', 'boba', 'trà sữa, bubble tea'], ['🥤', 'soda drink', 'nước ngọt, đồ uống'],
  ['🧃', 'juice', 'nước ép'], ['🍕', 'pizza', 'pizza'], ['🍔', 'burger hamburger', 'hamburger'], ['🍟', 'fries', 'khoai tây chiên'], ['🍿', 'popcorn', 'bỏng ngô, bắp rang'], ['🍜', 'noodle noodles ramen', 'mì, phở, bún'],
  ['🍚', 'rice', 'cơm'], ['🍙', 'onigiri riceball', 'cơm nắm'], ['🍣', 'sushi', 'sushi'], ['🥟', 'dumpling', 'bánh bao, sủi cảo'], ['🍤', 'tempura', 'tôm chiên'], ['🍗', 'drumstick', 'đùi gà, gà rán'],
  ['🥗', 'salad', 'salad, rau trộn'], ['🥖', 'bread baguette', 'bánh mì'], ['🥐', 'croissant', 'bánh sừng bò'], ['🥞', 'pancake pancakes', 'bánh kếp'], ['🧇', 'waffle', 'bánh waffle'],
  ['🍦', 'icecream', 'kem, ice cream, cây kem'], ['🍩', 'donut doughnut', 'bánh donut'], ['🍪', 'cookie biscuit', 'bánh quy'], ['🍬', 'candy sweet', 'kẹo'], ['🍭', 'lollipop', 'kẹo mút'], ['🍫', 'chocolate', 'sô cô la, socola'],
  ['🍓', 'strawberry', 'dâu, dâu tây'], ['🍒', 'cherry', 'anh đào, cherry'], ['🍑', 'peach', 'quả đào, trái đào, đào'], ['🍎', 'apple', 'táo'], ['🍐', 'pear', 'lê'], ['🍌', 'banana', 'chuối'], ['🍉', 'watermelon', 'dưa hấu'],
  ['🍇', 'grape grapes', 'nho'], ['🍊', 'tangerine orange', 'quả cam, trái cam, cam'], ['🍋', 'lemon lime', 'chanh'], ['🥑', 'avocado', 'trái bơ, quả bơ'], ['🥭', 'mango', 'xoài'], ['🍍', 'pineapple', 'dứa, thơm, khóm'],
  ['🥥', 'coconut', 'dừa, quả dừa'], ['🥝', 'kiwi', 'kiwi'], ['🫐', 'blueberry blueberries', 'việt quất'], ['🥕', 'carrot', 'cà rốt'], ['🌽', 'corn', 'ngô, bắp'], ['🍅', 'tomato', 'cà chua'], ['🥦', 'broccoli', 'súp lơ, bông cải'],
  ['🌶️', 'chili pepper', 'ớt'], ['🥔', 'potato', 'khoai tây'], ['🍠', 'sweetpotato', 'khoai lang'], ['🍳', 'egg', 'trứng'], ['😊', 'happyface', 'mặt cười'], ['😂', 'laugh lol haha', 'cười lớn'],
  ['😢', 'sadface', 'mặt buồn'], ['😎', 'sunglasses', 'kính râm'], ['🤩', 'wow amazing', 'tuyệt vời'], ['🤗', 'hug', 'ôm, cái ôm'], ['👍', 'thumbsup', 'like, tốt'], ['👏', 'clap', 'vỗ tay'],
  ['🧧', 'tet', 'tết, lì xì, năm mới'], ['🎄', 'christmas xmas noel', 'giáng sinh, noel, cây thông noel'], ['🎃', 'halloween pumpkin', 'bí ngô'], ['🎓', 'graduation', 'tốt nghiệp'], ['🧳', 'travel trip luggage', 'du lịch, chuyến đi, vali'],
  ['⚽', 'football soccer', 'bóng đá'], ['🏀', 'basketball', 'bóng rổ'], ['🏸', 'badminton', 'cầu lông'], ['🎮', 'game games gaming', 'chơi game, trò chơi'], ['💻', 'laptop computer', 'máy tính'], ['📱', 'phone', 'điện thoại']
];
const stripVi = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const PLANTS = new Set(['🌳', '🌲', '🌴', '🌱', '🪴', '🍃', '🍀', '🌵']);
const COLOR_DATA = [
  ['đỏ đô, đỏ sẫm, đỏ rượu, maroon, burgundy', '#9b2335'], ['đỏ, đỏ tươi, red', '#e5484d'], ['cam, orange', '#f28c28'], ['vàng kim, nhũ vàng, gold, golden', '#d4a017'], ['vàng, yellow', '#f5c518'],
  ['xanh lá mạ, xanh nõn chuối, lime', '#9ccc3d'], ['xanh lá, xanh lá cây, xanh lục, lục, green', '#3fa34d'], ['xanh da trời, xanh nhạt, sky, skyblue', '#7cc4f0'],
  ['xanh dương, xanh biển, xanh nước biển, lam, blue', '#3b82f6'], ['xanh navy, xanh đậm, navy', '#1f3a68'], ['xanh ngọc, ngọc, teal, turquoise', '#2bb5a8'], ['bạc hà, mint', '#8fe3c8'],
  ['tím nhạt, oải hương, lavender, lilac', '#b9a3ea'], ['tím, purple, violet', '#8b5cf6'], ['hồng phấn, hồng nhạt, babypink', '#f9b8cf'], ['hồng, pink', '#f472b6'], ['nâu, brown', '#8b5a3c'],
  ['đen, black', '#2b2b2b'], ['trắng, white', '#f7f7f7'], ['xám, ghi, gray, grey', '#9aa0a6'], ['be, beige', '#e8d5b5'], ['bạc, silver', '#c0c6cc'], ['xanh, cyan', 'xanh'], ['cầu vồng, rainbow, nhiều màu, colorful', 'rainbow']
];
const MOD_DATA = { // modifiers
  face: [['dễ thương, đáng yêu, xinh, cute, kawaii, adorable', 'happy'], ['cười, vui, vui vẻ, hạnh phúc, happy, smile, smiling', 'happy'], ['buồn, khóc, sad, crying, cry', 'sad'],
    ['ngủ, buồn ngủ, sleepy, sleeping, sleep', 'sleepy'], ['yêu, si tình, love, loving, inlove', 'love'], ['giận, tức giận, angry, mad', 'angry'], ['ngầu, cool', 'cool']],
  size: [['to, lớn, bự, khổng lồ, big, huge, large, giant', 1.3], ['nhỏ, tí hon, mini, tiny, small, little', .72]],
  qty: [['hai, đôi, cặp, two, pair, couple', 2], ['ba, three', 3], ['bốn, four', 4], ['năm, five', 5], ['nhiều, mấy, many, lots, lot, several', 3]],
  sparkle: [['lấp lánh, long lanh, sparkle, sparkly, sparkling, glitter, shiny, magic, phép thuật', 1]],
  pastel: [['pastel, nhạt, dịu, soft, light', 1]],
  stop: 'con cái chiếc quả trái bông đóa một những các cho với và and with a an the of màu color colour colored có is in on ở trên của mình tôi em anh my me please hãy làm tạo vẽ make draw create sticker ảnh hình picture'
};
const buildMap = (rows, mapVal) => { const acc = new Map(), plain = new Map(); for (const [k, v] of rows) for (const ph of k.split(',').map(x => x.trim().toLowerCase().normalize('NFC')).filter(Boolean)) { if (!acc.has(ph)) acc.set(ph, mapVal(v)); const pl = stripVi(ph); if (!plain.has(pl)) plain.set(pl, mapVal(v)); } return { acc, plain }; };
const OBJ = (() => { const acc = new Map(), plain = new Map(), en = new Map(); for (const [em, ew, vi] of EMO_DATA) { for (const w of ew.split(' ')) if (w) { if (!en.has(w)) en.set(w, em); if (!plain.has(w)) plain.set(w, em); if (!acc.has(w)) acc.set(w, em); } for (const ph of vi.split(',').map(x => x.trim().toLowerCase().normalize('NFC')).filter(Boolean)) { if (!acc.has(ph)) acc.set(ph, em); const pl = stripVi(ph); if (!plain.has(pl)) plain.set(pl, em); } } return { acc, plain, en }; })();
const COL = buildMap(COLOR_DATA, v => v);
const MODS = Object.fromEntries(['face', 'size', 'qty', 'sparkle', 'pastel'].map(k => [k, buildMap(MOD_DATA[k], v => v)]));
const STOP = new Set(MOD_DATA.stop.split(' ').flatMap(w => [w, stripVi(w)]));
function lev1(a, b) { // edit distance ≤ 1
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } }
  return e + (a.length - i) + (b.length - j) <= 1;
}
function parseSticker(text) {
  const accented = /[^\x00-\x7f]/.test(text);
  const tok = text.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const look = (m, ph) => accented ? m.acc.get(ph) : m.plain.get(stripVi(ph)); // with accents typed, words must match exactly
  const ents = [], unknown = [];
  for (let i = 0; i < tok.length;) {
    if (/^\d+$/.test(tok[i])) { ents.push({ qty: Math.min(6, Math.max(1, +tok[i])) }); i++; continue; }
    let best = null;
    for (let n = Math.min(3, tok.length - i); n >= 1 && !best; n--) {
      const ph = tok.slice(i, i + n).join(' '), e = { n };
      const o = look(OBJ, ph), c = look(COL, ph);
      if (o) e.obj = o; if (c) e.color = c;
      for (const k of ['face', 'size', 'qty', 'sparkle', 'pastel']) { const v = look(MODS[k], ph); if (v !== undefined) e[k] = v; }
      if (Object.keys(e).length > 1) best = e;
    }
    if (best) { ents.push(best); i += best.n; continue; }
    const w = tok[i]; i++;
    if (STOP.has(w) || STOP.has(stripVi(w))) continue;
    // small typos and plurals: "kittyy", "cats", "meoo"
    const ascii = !/[^\x00-\x7f]/.test(w), pool = accented ? (ascii ? OBJ.en : OBJ.acc) : OBJ.plain, pw = accented ? w : stripVi(w);
    let fz = ascii ? pool.get(pw.replace(/s$/, '')) : null;
    if (!fz && pw.length >= 4) for (const [k, v] of pool) if (k.length >= 3 && !k.includes(' ') && lev1(pw, k)) { fz = v; break; }
    if (fz) ents.push({ obj: fz }); else unknown.push(w);
  }
  // words that can be both a thing and a colour/mood ("cam", "yêu"): a thing only when nothing else is
  const pureObj = ents.filter(e => e.obj && !e.color && e.face === undefined).length;
  for (const e of ents) if (e.obj && (e.color || e.face !== undefined)) { if (pureObj) delete e.obj; else { delete e.color; delete e.face; } }
  const objs = [], colors = []; let face = null, size = 1, sparkle = false, pastel = false, qty = 1, pendingQty = null;
  for (const e of ents) {
    if (e.qty !== undefined) pendingQty = e.qty;
    if (e.obj) { objs.push({ em: e.obj, count: pendingQty || 1 }); if (pendingQty) qty = pendingQty; pendingQty = null; }
    if (e.color) colors.push(e.color);
    if (e.face !== undefined) face = e.face;
    if (e.size !== undefined) size = e.size;
    if (e.sparkle !== undefined) sparkle = true;
    if (e.pastel !== undefined) pastel = true;
  }
  if (pendingQty && objs.length) objs[objs.length - 1].count = pendingQty;
  objs.forEach((o, i) => { o.color = colors.length === 1 ? colors[0] : colors[i] || null; if (o.color === 'xanh') o.color = PLANTS.has(o.em) ? '#3fa34d' : '#38a3d1'; });
  if (colors[0] === 'xanh') colors[0] = '#38a3d1';
  return { objs: objs.slice(0, 3), colors, face, size, sparkle, pastel, unknown };
}
/* --- colour helpers --- */
function rgb2hsl(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; if (!s) return [l, l, l]; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3), f(h), f(h - 1 / 3)]; }
function recolorCanvas(c, color, pastel) { // repaint the main coloured part, keep shading & dark outlines
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), p = d.data, W2 = c.width;
  const hist = new Float32Array(36); let sat = 0, opaque = 0;
  for (let i = 0; i < p.length; i += 4) { if (p[i + 3] < 40) continue; opaque++; const [h, s, l] = rgb2hsl(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255); if (s > .18 && l > .1 && l < .95) { hist[Math.floor(h / 10) % 36] += s; sat++; } }
  let useHue = sat > opaque * .15, dom = 0; if (useHue) { let bi = 0; for (let k = 1; k < 36; k++) if (hist[k] > hist[bi]) bi = k; dom = bi * 10 + 5; }
  const inRegion = (h, s, l) => useHue ? (s > .12 && l > .07 && l < .97 && Math.abs(((h - dom + 540) % 360) - 180) < 48) : (l > .18 && l < .99);
  let sumL = 0, n = 0;
  for (let i = 0; i < p.length; i += 4) { if (p[i + 3] < 40) continue; const [h, s, l] = rgb2hsl(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255); if (inRegion(h, s, l)) { sumL += l; n++; } }
  if (!n) return c;
  const avgL = sumL / n, rainbow = color === 'rainbow';
  let [th, ts, tl] = rainbow ? [0, .75, .6] : rgb2hsl(...hexRgb(color).map(v => v / 255));
  if (pastel) { ts *= .6; tl = tl + (1 - tl) * .45; }
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 40) continue;
    const [h, s, l] = rgb2hsl(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255);
    if (!inRegion(h, s, l)) continue;
    const hh = rainbow ? ((i / 4) % W2) / W2 * 330 : th;
    const nl = clamp(l + (tl - avgL) * .85, .04, .97), ns = ts < .08 ? ts : clamp(ts * .85 + s * .15, 0, 1);
    const [r, g, b] = hsl2rgb(hh, ns, nl); p[i] = r * 255; p[i + 1] = g * 255; p[i + 2] = b * 255;
  }
  x.putImageData(d, 0, 0); return c;
}
function drawFace(x, cx, cy, S, mood) {
  const ink = '#3b2a26', e = S * .045, sp = S * .13;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = ink; x.fillStyle = ink; x.lineWidth = S * .025;
  x.globalAlpha = .45; x.fillStyle = '#ff7a93';
  [cx - sp - S * .07, cx + sp + S * .07].forEach(bx => { x.beginPath(); x.ellipse(bx, cy + S * .06, S * .05, S * .03, 0, 0, 6.29); x.fill(); });
  x.globalAlpha = 1; x.fillStyle = ink;
  const eye = (ex) => {
    if (mood === 'sleepy') { x.beginPath(); x.arc(ex, cy, e, .15 * Math.PI, .85 * Math.PI); x.stroke(); return; }
    if (mood === 'love') { x.fillStyle = '#e5484d'; x.beginPath(); const r = e * 1.1; x.moveTo(ex, cy + r); x.bezierCurveTo(ex - r * 2, cy - r * .3, ex - r * .8, cy - r * 1.8, ex, cy - r * .5); x.bezierCurveTo(ex + r * .8, cy - r * 1.8, ex + r * 2, cy - r * .3, ex, cy + r); x.fill(); x.fillStyle = ink; return; }
    if (mood === 'cool') { x.fillRect(ex - e * 1.6, cy - e, e * 3.2, e * 1.7); return; }
    x.beginPath(); x.ellipse(ex, cy, e * .85, e, 0, 0, 6.29); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex - e * .3, cy - e * .35, e * .32, 0, 6.29); x.fill(); x.fillStyle = ink;
  };
  eye(cx - sp); eye(cx + sp);
  if (mood === 'cool') { x.fillRect(cx - sp, cy - e * .4, sp * 2, e * .5); }
  if (mood === 'angry') { x.beginPath(); x.moveTo(cx - sp - e * 1.4, cy - e * 2.2); x.lineTo(cx - sp + e * 1.2, cy - e * 1.4); x.moveTo(cx + sp + e * 1.4, cy - e * 2.2); x.lineTo(cx + sp - e * 1.2, cy - e * 1.4); x.stroke(); }
  const my = cy + S * .07; x.beginPath();
  if (mood === 'sad' || mood === 'angry') x.arc(cx, my + S * .05, S * .045, 1.15 * Math.PI, 1.85 * Math.PI);
  else x.arc(cx, my - S * .01, S * .045, .15 * Math.PI, .85 * Math.PI);
  x.stroke();
  if (mood === 'sad') { x.fillStyle = '#7cc4f0'; x.beginPath(); x.ellipse(cx - sp, cy + e * 2.2, e * .5, e * .8, 0, 0, 6.29); x.fill(); }
  x.restore();
}
function emojiCanvas(em, S) {
  const c = mkCanvas(S, S), x = c.getContext('2d');
  x.font = `${Math.round(S * .82)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(em, S / 2, S / 2 + S * .05);
  return c;
}
const PASTELS = ['#f9a8c0', '#ffc78a', '#ffe08a', '#a8e0a0', '#9fd3f0', '#c4b1f0', '#f5b0a0'];
function blobCanvas(seedText, color, S) { // a cute little character for anything we have no picture of
  let hsh = 0; for (const ch of seedText) hsh = (hsh * 31 + ch.codePointAt(0)) >>> 0;
  const col = color && color !== 'rainbow' ? color : PASTELS[hsh % PASTELS.length];
  const c = mkCanvas(S, S), x = c.getContext('2d'), k = S / 200, shape = hsh % 5;
  x.save(); x.scale(k, k); x.beginPath();
  if (shape === 0) { x.moveTo(100, 22); x.bezierCurveTo(160, 18, 186, 70, 178, 118); x.bezierCurveTo(170, 168, 128, 182, 98, 180); x.bezierCurveTo(52, 178, 20, 150, 24, 104); x.bezierCurveTo(28, 56, 52, 26, 100, 22); }
  else if (shape === 1) { x.moveTo(40, 180); x.lineTo(40, 90); x.bezierCurveTo(40, 40, 160, 40, 160, 90); x.lineTo(160, 180); x.lineTo(140, 164); x.lineTo(120, 180); x.lineTo(100, 164); x.lineTo(80, 180); x.lineTo(60, 164); x.closePath(); }
  else if (shape === 2) { x.moveTo(100, 176); x.bezierCurveTo(20, 120, 16, 60, 58, 44); x.bezierCurveTo(82, 36, 96, 52, 100, 62); x.bezierCurveTo(104, 52, 118, 36, 142, 44); x.bezierCurveTo(184, 60, 180, 120, 100, 176); }
  else if (shape === 3) { x.arc(100, 104, 74, 0, 6.29); }
  else { x.moveTo(52, 160); x.arcTo(14, 160, 14, 122, 36); x.arcTo(14, 86, 50, 86, 34); x.arc(80, 82, 34, Math.PI * 1.05, Math.PI * 1.8); x.arc(126, 80, 42, Math.PI * 1.15, Math.PI * 1.95); x.arcTo(186, 86, 186, 122, 34); x.arcTo(186, 160, 150, 160, 36); x.closePath(); }
  x.fillStyle = col; x.fill();
  x.save(); x.clip(); const g = x.createLinearGradient(0, 30, 0, 190); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.08)'); x.fillStyle = g; x.fillRect(0, 0, 200, 200);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(68, 64, 16, 9, -.6, 0, 6.29); x.fill(); x.restore();
  x.restore();
  return c;
}
function sparkles(x, w, h) {
  const star = (cx, cy, r) => { x.beginPath(); x.moveTo(cx, cy - r); x.quadraticCurveTo(cx + r * .18, cy - r * .18, cx + r, cy); x.quadraticCurveTo(cx + r * .18, cy + r * .18, cx, cy + r); x.quadraticCurveTo(cx - r * .18, cy + r * .18, cx - r, cy); x.quadraticCurveTo(cx - r * .18, cy - r * .18, cx, cy - r); x.fill(); };
  x.fillStyle = '#ffd65a'; star(w * .1, h * .16, h * .09); star(w * .9, h * .3, h * .07); star(w * .84, h * .86, h * .055); x.fillStyle = '#fff3b0'; star(w * .16, h * .8, h * .05);
}
const FACED = new Set(['🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🦊', '🐷', '🐮', '🐸', '🐯', '🦁', '🐵', '🐭', '🐹', '🐲', '🐔', '🐴', '👻', '👽', '🤖', '😊', '😂', '😢', '😎', '🤩', '🤗', '⛄', '🌝']);
function composeSticker(spec, text) {
  const S = 180, parts = [];
  let usedBlob = false;
  const items = spec.objs.length ? spec.objs : [{ blob: true, color: spec.colors[0] || null, count: 1 }];
  for (const o of items) {
    let base;
    if (o.blob) { base = blobCanvas(spec.unknown.join(' ') || text, o.color, S); usedBlob = true; }
    else { base = emojiCanvas(o.em, S); if (o.color) recolorCanvas(base, o.color, spec.pastel); }
    const face = spec.face || (o.blob ? 'happy' : null);
    if (face && !o.blob && FACED.has(o.em)) { // already has a face: add a little mood badge instead
      const bx = base.getContext('2d'), badge = { happy: '💕', sleepy: '💤', love: '❤️', sad: '💧', angry: '💢', cool: '🕶️' }[face] || '✨';
      bx.font = `${Math.round(S * .3)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; bx.textAlign = 'center'; bx.textBaseline = 'middle';
      bx.fillText(badge, S * .84, S * .18);
    } else if (face) drawFace(base.getContext('2d'), S / 2, S * .54, S, face);
    const n = Math.min(5, o.count || 1);
    if (n === 1) { parts.push(base); continue; }
    const g = mkCanvas(S + (n - 1) * S * .42, S * (1 + (n > 2 ? .12 : 0))), gx = g.getContext('2d');
    for (let i = 0; i < n; i++) { const sc = i % 2 ? .82 : .92; gx.drawImage(base, i * S * .42 + (S - S * sc) / 2, (i % 2 ? S * .14 : 0) + (S - S * sc) / 2, S * sc, S * sc); }
    parts.push(g);
  }
  const gap = -S * .1, W2 = parts.reduce((s, p) => s + p.width, 0) + gap * (parts.length - 1), H2 = Math.max(...parts.map(p => p.height));
  const pad = spec.sparkle ? S * .22 : 0;
  const c = mkCanvas(W2 + pad * 2, H2 + pad * 2), x = c.getContext('2d'); let ox = pad;
  for (const p of parts) { x.drawImage(p, ox, pad + (H2 - p.height) / 2); ox += p.width + gap; }
  if (spec.sparkle) sparkles(x, c.width, c.height);
  return { canvas: dieCut(c, 10), usedBlob };
}
async function createNamedSticker() {
  const inp = $('#stkName'), text = inp.value.trim();
  if (!text) { inp.focus(); return toast(t('typeStickerName')); }
  try {
    const asText = /^(text|chữ|chu)\b\s*[:\-]?\s*(.*)$/iu.exec(text);
    let canvas, usedBlob = false, size = 1;
    if (asText) {
      const words = asText[2].trim();
      if (!words) { inp.focus(); return toast(t('typeStickerName')); }
      canvas = await textStickerCanvas(words);
    } else {
      const spec = parseSticker(text); size = spec.size;
      ({ canvas, usedBlob } = composeSticker(spec, text));
    }
    const url = canvas.toDataURL('image/png'), im = await loadImg(url);
    const imgId = uid(); images[imgId] = url; imgCache[imgId] = im;
    state.myStickers = [{ id: uid(), label: text, imgId }, ...(state.myStickers || [])].slice(0, 60);
    finishEdit(); pushHistory();
    const k = Math.min(.75, 230 * size / Math.max(canvas.width, canvas.height));
    addImageElement(url, im, canvas.width * k, canvas.height * k, W / 2, H / 2, true);
    renderPage(); renderLayers(); renderAlbums(); syncTextControls(); markDirty(); playTing();
    inp.value = ''; renderMine();
    toast(usedBlob ? t('stickerBlob', { q: text }) : t('stickerMade'));
  } catch (err) { console.error(err); toast(t('stickerFail')); }
}

function renderMine() {
  const box = $('#palMine'); if (!box) return;
  box.innerHTML = '';
  const list = (state.myStickers || []).filter(m => images[m.imgId]);
  if (!list.length) { const e = document.createElement('div'); e.className = 'empty mine-empty'; e.textContent = t('noMine'); box.appendChild(e); return; }
  list.forEach(m => {
    const b = document.createElement('button'); b.draggable = true; b.title = m.label;
    b.innerHTML = `<img src="${images[m.imgId]}" alt=""><span class="mdel" title="${t('deleteSticker')}">×</span>`;
    b.onclick = ev => {
      if (ev.target.closest('.mdel')) { state.myStickers = state.myStickers.filter(x => x.id !== m.id); renderMine(); markDirty(); return; }
      addPaletteItem('mine', m.id);
    };
    b.addEventListener('dragstart', ev => { ev.dataTransfer.setData('application/x-dii', JSON.stringify({ kind: 'mine', key: m.id })); ev.dataTransfer.effectAllowed = 'copy'; });
    box.appendChild(b);
  });
}

/* ============ export helpers: zip with a folder inside ============ */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) { // [{ name, data: Uint8Array }] stored without compression
  const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + sz;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

/* ============ multi-select, groups, right-click menu ============ */
let selIds = [];
function getSel() { // the current selection, kept in step with selectedId
  if (!selectedId) { selIds = []; return selIds; }
  if (!selIds.includes(selectedId)) selIds = [selectedId];
  selIds = selIds.filter(id => { const e = findEl(id); return e && e.page === page(); });
  if (!selIds.length) selectedId = null;
  return selIds;
}
const groupOf = e => !e ? [] : e.group ? pageEls(e.page).filter(x => x.group === e.group) : [e];
function setSel(ids, primary, expand = true) {
  const out = [];
  ids.filter(Boolean).forEach(id => { const e = findEl(id); (expand ? groupOf(e) : e ? [e] : []).forEach(x => { if (!out.includes(x.id)) out.push(x.id); }); });
  selIds = out; selectedId = out.length ? (primary && out.includes(primary) ? primary : out[out.length - 1]) : null;
  paintSel(); renderLayers(); syncTextControls();
}
function paintSel() {
  const sel = getSel(), multi = sel.length > 1;
  if (strokeSel && (sel.length !== 1 || sel[0] !== strokeSel.id)) { const old = findEl(strokeSel.id); strokeSel = null; if (old && old.page === page()) rerenderEl(old); syncDrawControls(); }
  $$('#page .el').forEach(n => { const on = sel.includes(n.dataset.id); n.classList.toggle('sel', on && !multi); n.classList.toggle('msel', on && multi); });
  updateSelBox();
}
function elBounds(e) {
  if (e.type === 'line') return { x0: e.x + Math.min(e.ax, e.bx), y0: e.y + Math.min(e.ay, e.by), x1: e.x + Math.max(e.ax, e.bx), y1: e.y + Math.max(e.ay, e.by) };
  const { hx, hy } = ext(e), cx = e.x + e.w / 2, cy = e.y + e.h / 2, pad = e.type === 'draw' ? (e.pad || 2) * e.w / e.vw : 0;
  return { x0: cx - hx + pad, y0: cy - hy + pad, x1: cx + hx - pad, y1: cy + hy - pad };
}
function unionBounds(els) {
  return els.reduce((u, e) => { const b = elBounds(e); return { x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) }; }, { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
}
function updateSelBox() {
  let b = $('#selBox');
  const sel = getSel();
  if (sel.length < 2) { if (b) b.style.display = 'none'; return; }
  if (!b) { b = document.createElement('div'); b.id = 'selBox'; b.className = 'selbox'; pageEl.appendChild(b); }
  const u = unionBounds(sel.map(findEl).filter(Boolean)), p = 6;
  Object.assign(b.style, { display: 'block', left: u.x0 - p + 'px', top: u.y0 - p + 'px', width: u.x1 - u.x0 + p * 2 + 'px', height: u.y1 - u.y0 + p * 2 + 'px' });
  b.dataset.n = t('selectedN', { n: sel.length });
}
function moveMany(els, dx, dy, orig) { // move several things together, never past the page edge
  const u = unionBounds(els.map(e => ({ ...e, x: orig[e.id].x, y: orig[e.id].y })));
  dx = clamp(dx, -u.x0, W - u.x1); dy = clamp(dy, -u.y0, H - u.y1);
  els.forEach(e => { e.x = orig[e.id].x + dx; e.y = orig[e.id].y + dy; updateDom(e); });
  updateSelBox();
}
function cleanGroups() {
  const a = album(), count = {};
  a.elements.forEach(e => { if (e.group) count[e.group + '|' + e.page] = (count[e.group + '|' + e.page] || 0) + 1; });
  a.elements.forEach(e => { if (e.group && count[e.group + '|' + e.page] < 2) delete e.group; });
}
function groupSelected() {
  finishEdit();
  const sel = getSel();
  if (sel.length < 2) return toast(t('needTwo'));
  pushHistory();
  const a = album(); a.counters.group = (a.counters.group || 0) + 1;
  const gid = 'g' + uid(); a.groupNames = a.groupNames || {}; a.groupNames[gid] = 'group' + a.counters.group;
  sel.forEach(id => { const e = findEl(id); if (e) e.group = gid; });
  cleanGroups();
  const list = pageEls().sort((x, y) => y.z - x.z), top = list.findIndex(e => e.group === gid);
  const members = list.filter(e => e.group === gid), rest = list.filter(e => e.group !== gid);
  rest.splice(top, 0, ...members); // keep the group's layers together
  applyOrder(rest); setSel(members.map(e => e.id)); markDirty();
  toast(t('grouped', { n: a.groupNames[gid] }));
}
function ungroupSelected() {
  finishEdit();
  const gids = new Set(getSel().map(id => (findEl(id) || {}).group).filter(Boolean));
  if (!gids.size) return toast(t('noGroup'));
  pushHistory();
  album().elements.forEach(e => { if (gids.has(e.group)) delete e.group; });
  renderLayers(); markDirty(); toast(t('ungrouped'));
}
function arrange(front) {
  const sel = new Set(getSel()); if (!sel.size) return;
  const list = pageEls().sort((a, b) => b.z - a.z), mv = list.filter(e => sel.has(e.id)), rest = list.filter(e => !sel.has(e.id));
  pushHistory(); applyOrder(front ? [...mv, ...rest] : [...rest, ...mv]); paintSel();
}
function selectAll() { finishEdit(); const ids = pageEls().map(e => e.id); if (ids.length) setSel(ids, null, false); }
/* right-click menu */
function showCtx(x, y) {
  let m = $('#ctxMenu');
  if (!m) { m = document.createElement('div'); m.id = 'ctxMenu'; document.body.appendChild(m); }
  const sel = getSel(), hasGroup = sel.some(id => (findEl(id) || {}).group);
  const items = [
    ['group', t('ctxGroup'), 'Ctrl+G', sel.length >= 2], ['ungroup', t('ctxUngroup'), 'Ctrl+⇧+G', hasGroup], ['-'],
    ['front', t('ctxFront'), '', sel.length > 0], ['back', t('ctxBack'), '', sel.length > 0], ['-'],
    ['all', t('ctxAll'), 'Ctrl+A', pageEls().length > 0], ['del', t('ctxDelete'), 'Del', sel.length > 0]
  ];
  m.innerHTML = items.map(it => it[0] === '-' ? '<div class="sep"></div>' : `<button data-a="${it[0]}"${it[3] ? '' : ' disabled'}><span>${esc(it[1])}</span>${it[2] ? `<kbd>${it[2]}</kbd>` : ''}</button>`).join('');
  m.style.display = 'block';
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  m.onclick = ev => {
    const b = ev.target.closest('button'); if (!b || b.disabled) return;
    hideCtx();
    ({ group: groupSelected, ungroup: ungroupSelected, front: () => arrange(true), back: () => arrange(false), all: selectAll, del: deleteSelected })[b.dataset.a]();
  };
}
function hideCtx() { const m = $('#ctxMenu'); if (m) m.style.display = 'none'; }
function bindMulti() {
  document.addEventListener('pointerdown', ev => { if (!ev.target.closest('#ctxMenu')) hideCtx(); }, true);
  window.addEventListener('blur', hideCtx);
  $('#layers').addEventListener('contextmenu', ev => {
    const row = ev.target.closest('.layer'); if (!row) return;
    ev.preventDefault(); finishEdit();
    const sel = getSel();
    if (row.dataset.gid) { const ids = pageEls().filter(e => e.group === row.dataset.gid).map(e => e.id); if (!ids.every(id => sel.includes(id))) setSel(ids); }
    else if (!sel.includes(row.dataset.id)) setSel([row.dataset.id], row.dataset.id, false);
    showCtx(ev.clientX, ev.clientY);
  });
  pageEl.addEventListener('contextmenu', ev => {
    const elD = ev.target.closest('.el'); if (!elD || editingId) return;
    ev.preventDefault();
    if (!getSel().includes(elD.dataset.id)) setSel([elD.dataset.id], elD.dataset.id);
    showCtx(ev.clientX, ev.clientY);
  });
}

/* ============ built-in stickers & emoji ============ */
const INK = '#5e3f37';
const face = (cx, cy, sp = 10, sc = 1) => `<circle cx="${cx - sp}" cy="${cy}" r="${3 * sc}" fill="${INK}"/><circle cx="${cx + sp}" cy="${cy}" r="${3 * sc}" fill="${INK}"/><circle cx="${cx - sp - 1}" cy="${cy - 1.2 * sc}" r="${1 * sc}" fill="#fff"/><circle cx="${cx + sp - 1}" cy="${cy - 1.2 * sc}" r="${1 * sc}" fill="#fff"/><path d="M${cx - 4 * sc} ${cy + 5 * sc}q${4 * sc} ${4 * sc} ${8 * sc} 0" stroke="${INK}" stroke-width="${2.4 * sc}" fill="none" stroke-linecap="round"/><ellipse cx="${cx - sp - 6 * sc}" cy="${cy + 6 * sc}" rx="${4 * sc}" ry="${2.6 * sc}" fill="#ff7a93" opacity=".45"/><ellipse cx="${cx + sp + 6 * sc}" cy="${cy + 6 * sc}" rx="${4 * sc}" ry="${2.6 * sc}" fill="#ff7a93" opacity=".45"/>`;
const starPath = (cx, cy, R, r, n = 5, rot = -90) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + f2(cx + Math.cos(a) * rr) + ' ' + f2(cy + Math.sin(a) * rr); } return d + 'Z'; };
const STICKERS = {
  heart: `<path d="M50 86C21 65 9 48 13 31C17 15 38 11 50 27C62 11 83 15 87 31C91 48 79 65 50 86Z" fill="#f58fa3"/><ellipse cx="30" cy="31" rx="7" ry="4" fill="#fff" opacity=".65" transform="rotate(-35 30 31)"/>${face(50, 47, 11)}`,
  star: `<path d="${starPath(50, 54, 46, 21)}" fill="#ffd36b" stroke="#ffd36b" stroke-width="6" stroke-linejoin="round"/>${face(50, 54, 9)}`,
  sun: `<g stroke="#ffb547" stroke-width="7" stroke-linecap="round">${[...Array(10)].map((_, i) => { const a = i * 36 * Math.PI / 180; return `<path d="M${f2(50 + Math.cos(a) * 33)} ${f2(50 + Math.sin(a) * 33)}L${f2(50 + Math.cos(a) * 44)} ${f2(50 + Math.sin(a) * 44)}"/>`; }).join('')}</g><circle cx="50" cy="50" r="26" fill="#ffcf5a"/>${face(50, 50, 9)}`,
  cloud: `<path d="M24 74a16 16 0 0 1 1-32a22 22 0 0 1 42-8a19 19 0 0 1 9 40Z" fill="#e3f1ff"/><path d="M24 74a16 16 0 0 1 1-32a22 22 0 0 1 42-8a19 19 0 0 1 9 40Z" fill="none" stroke="#b9d5ef" stroke-width="2.5"/>${face(50, 56, 10)}`,
  flower: `${[...Array(5)].map((_, i) => `<ellipse cx="50" cy="27" rx="15" ry="21" fill="#f8b3cb" transform="rotate(${i * 72} 50 52)"/>`).join('')}<circle cx="50" cy="52" r="16" fill="#ffd66e"/>${face(50, 52, 6, .7)}`,
  rainbow: `${[['#f7a1a1', 40], ['#fcd09b', 32], ['#fff0a3', 24], ['#b9e3c8', 16]].map(([c, r]) => `<path d="M${50 - r} 66a${r} ${r} 0 0 1 ${2 * r} 0" stroke="${c}" stroke-width="8.5" fill="none"/>`).join('')}<path d="M4 74a8 8 0 0 1 6-12a9 9 0 0 1 16 0a7 7 0 0 1 2 12Z" fill="#fff" stroke="#e7d8d2" stroke-width="2"/><path d="M72 74a8 8 0 0 1 6-12a9 9 0 0 1 16 0a7 7 0 0 1 2 12Z" fill="#fff" stroke="#e7d8d2" stroke-width="2"/>`,
  bow: `<path d="M46 50C30 30 10 32 12 50C14 68 32 68 46 52Z" fill="#f58fa3"/><path d="M54 50C70 30 90 32 88 50C86 68 68 68 54 52Z" fill="#f58fa3"/><path d="M44 54L34 84L44 78L50 86L52 56Z" fill="#ee7a91"/><path d="M56 54L66 84L56 78L50 86L48 56Z" fill="#ee7a91"/><rect x="41" y="41" width="18" height="20" rx="7" fill="#ee7a91"/><path d="M22 46q8-6 16 2" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6" stroke-linecap="round"/>`,
  cherry: `<path d="M34 64C38 40 50 24 66 14M66 64C64 44 66 28 66 14" stroke="#6aa35a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M66 14C76 6 92 10 90 22C80 26 70 22 66 14Z" fill="#8cc777"/><circle cx="32" cy="70" r="17" fill="#e8505b"/><circle cx="68" cy="70" r="17" fill="#e8505b"/><circle cx="26" cy="64" r="4" fill="#fff" opacity=".7"/><circle cx="62" cy="64" r="4" fill="#fff" opacity=".7"/>`,
  cat: `<path d="M18 40L22 10L42 28Z" fill="#ffcf9e"/><path d="M82 40L78 10L58 28Z" fill="#ffcf9e"/><path d="M24 34L26 18L36 28Z" fill="#ffa9b8"/><path d="M76 34L74 18L64 28Z" fill="#ffa9b8"/><ellipse cx="50" cy="55" rx="38" ry="32" fill="#ffcf9e"/><path d="M38 28q4 6 0 10M50 26v10M62 28q-4 6 0 10" stroke="#f0a96a" stroke-width="3" fill="none" stroke-linecap="round"/>${face(50, 56, 13)}<path d="M8 58l16 2M8 68l16-2M92 58l-16 2M92 68l-16-2" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`,
  bunny: `<ellipse cx="34" cy="26" rx="10" ry="24" fill="#fff4f6" stroke="#ecc9d3" stroke-width="2"/><ellipse cx="66" cy="26" rx="10" ry="24" fill="#fff4f6" stroke="#ecc9d3" stroke-width="2"/><ellipse cx="34" cy="28" rx="5" ry="16" fill="#ffc2cf"/><ellipse cx="66" cy="28" rx="5" ry="16" fill="#ffc2cf"/><ellipse cx="50" cy="62" rx="34" ry="28" fill="#fff4f6" stroke="#ecc9d3" stroke-width="2"/>${face(50, 62, 12)}`,
  bear: `<circle cx="22" cy="28" r="13" fill="#c99271"/><circle cx="78" cy="28" r="13" fill="#c99271"/><circle cx="22" cy="28" r="6" fill="#efc5a9"/><circle cx="78" cy="28" r="6" fill="#efc5a9"/><circle cx="50" cy="55" r="36" fill="#c99271"/><ellipse cx="50" cy="66" rx="15" ry="11" fill="#f1d5bf"/><ellipse cx="50" cy="61" rx="5" ry="3.6" fill="${INK}"/><circle cx="37" cy="48" r="3.4" fill="${INK}"/><circle cx="63" cy="48" r="3.4" fill="${INK}"/><path d="M46 69q4 4 8 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="26" cy="60" rx="5" ry="3" fill="#ff7a93" opacity=".4"/><ellipse cx="74" cy="60" rx="5" ry="3" fill="#ff7a93" opacity=".4"/>`,
  strawberry: `<path d="M50 90C24 76 14 52 22 36C30 24 70 24 78 36C86 52 76 76 50 90Z" fill="#ef5d6a"/><path d="M30 26L50 34L70 26L62 18L50 24L38 18Z" fill="#7cc06b"/>${[[34, 46], [50, 44], [66, 46], [40, 60], [60, 60], [50, 74], [32, 62], [68, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#ffe28a"/>`).join('')}`,
  sparkle: `<path d="M44 10C48 34 52 38 76 44C52 50 48 54 44 78C40 54 36 50 12 44C36 38 40 34 44 10Z" fill="#ffdf7e"/><path d="M78 62C80 72 82 74 92 76C82 78 80 80 78 90C76 80 74 78 64 76C74 74 76 72 78 62Z" fill="#ffc2d1"/>`,
  moon: `<path d="M64 10A40 40 0 1 0 90 66A32 32 0 1 1 64 10Z" fill="#ffe7a1"/><path d="M34 56q4 4 8 0M50 64q4 4 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="66" rx="4.5" ry="2.8" fill="#ff7a93" opacity=".45"/>`,
  mushroom: `<path d="M42 56h16v26a8 8 0 0 1-16 0Z" fill="#fbeee2"/><path d="M10 56C10 30 30 16 50 16C70 16 90 30 90 56Z" fill="#ef6b6b"/><circle cx="32" cy="36" r="6" fill="#fff"/><circle cx="56" cy="28" r="5" fill="#fff"/><circle cx="72" cy="44" r="5.5" fill="#fff"/><circle cx="46" cy="46" r="4" fill="#fff"/>${face(50, 70, 5, .6)}`,
  coffee: `<path d="M22 40h48v26a20 20 0 0 1-20 20h-8a20 20 0 0 1-20-20Z" fill="#fbe3d4"/><path d="M70 46h6a10 10 0 0 1 0 20h-6" stroke="#fbe3d4" stroke-width="7" fill="none"/><ellipse cx="46" cy="40" rx="24" ry="6" fill="#a9725a"/><path d="M36 30q-4-8 2-14M48 28q-4-8 2-14" stroke="#d9b8a8" stroke-width="3" fill="none" stroke-linecap="round"/>${face(46, 62, 8, .8)}`,
  tape: { vb: '-8 -8 156 66', w: 156, h: 66, plain: true, body: `<g transform="rotate(-4 70 25)"><path d="M4 6l4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4h132l-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4Z" fill="#f7c4d1" opacity=".88"/>${[...Array(9)].map((_, i) => `<rect x="${12 + i * 14}" y="6" width="6" height="36" fill="#fff" opacity=".35"/>`).join('')}</g>` }
};
const STICKER_FILTER = `<filter id="die" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feGaussianBlur in="d" stdDeviation="2" result="b"/><feOffset in="b" dy="1.6" result="o"/><feFlood flood-color="#7a4a3c" flood-opacity=".3"/><feComposite in2="o" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
function stickerSVG(key) {
  const st = STICKERS[key], o = typeof st === 'string' ? { vb: '-10 -10 120 120', w: 120, h: 120, body: st } : st;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w * 2}" height="${o.h * 2}" viewBox="${o.vb}"><defs>${STICKER_FILTER}</defs><g${o.plain ? '' : ' filter="url(#die)"'} stroke-linejoin="round">${o.body}</g></svg>`;
}
const stickerURL = key => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(stickerSVG(key));
const EMOJI = '😀 😊 🥰 😍 😘 😎 🤩 🥳 😇 🙈 😴 🤗 😺 🐶 🐰 🐻 🐼 🦊 🐥 🦄 🐱 🐸 🦋 🐝 🌸 🌷 🌻 💐 🍀 🌈 ⭐ ✨ 🌙 ☀️ ☁️ ❄️ 🔥 💖 💕 💗 💌 🎀 🎁 🎂 🍰 🧁 🍓 🍒 🍑 🍩 ☕ 🧋 🍦 🎈 🎉 📷 🎵 ✈️ 🏖️ 👑 💎 🌊'.split(' ');
const emojiCache = {};
function emojiURL(ch) {
  if (emojiCache[ch]) return emojiCache[ch];
  const c = mkCanvas(200, 200), x = c.getContext('2d');
  x.font = `150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 100, 108);
  return (emojiCache[ch] = c.toDataURL('image/png'));
}
async function addPaletteItem(kind, key, px, py) {
  if (crop) endCrop();
  finishEdit();
  try {
    let src, w, h;
    if (kind === 'mine') {
      const m = (state.myStickers || []).find(x => x.id === key); if (!m || !images[m.imgId]) return;
      src = images[m.imgId]; const im0 = await loadImg(src), k0 = Math.min(.6, 220 / Math.max(im0.naturalWidth, im0.naturalHeight)); w = im0.naturalWidth * k0; h = im0.naturalHeight * k0;
    }
    else if (kind === 'sticker') { src = stickerURL(key); const st = STICKERS[key]; w = typeof st === 'string' ? 110 : 170; h = typeof st === 'string' ? 110 : 72; }
    else { src = emojiURL(key); w = h = 80; }
    const im = await loadImg(src);
    pushHistory();
    const jit = () => (Math.random() - .5) * 160;
    addImageElement(src, im, w, h, px ?? W / 2 + jit(), py ?? H / 2 + jit(), kind === 'sticker');
    renderPage(); renderLayers(); renderAlbums(); syncTextControls(); markDirty(); playPop();
  } catch (err) { console.error(err); toast(t('stickerAddFail')); }
}

/* ============ weather background (real time only) ============ */
const CITIES = {
  hcm: { name: 'Hồ Chí Minh', en: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297 },
  hn: { name: 'Hà Nội', en: 'Hanoi', lat: 21.0285, lon: 105.8542 },
  dn: { name: 'Đà Nẵng', en: 'Da Nang', lat: 16.0544, lon: 108.2022 },
  ct: { name: 'Cần Thơ', en: 'Can Tho', lat: 10.0452, lon: 105.7469 },
  dl: { name: 'Đà Lạt', en: 'Da Lat', lat: 11.9404, lon: 108.4583 }
};
const cityName = k => (CITIES[k] ? (LANG === 'vi' ? CITIES[k].name : CITIES[k].en) : k);
const WX = {
  clear: { label: 'Sunny', icon: '☀️' },
  partly: { label: 'Partly cloudy', icon: '⛅' },
  overcast: { label: 'Overcast', icon: '☁️' },
  fog: { label: 'Foggy', icon: '🌫️' },
  drizzle: { label: 'Drizzle', icon: '🌦️' },
  rain: { label: 'Rain', icon: '🌧️' },
  heavyrain: { label: 'Heavy rain', icon: '🌧️' },
  thunder: { label: 'Thunderstorm', icon: '⛈️' },
  storm: { label: 'Storm', icon: '🌀' }
};
let wxLive = null, wxErr = false, wxUpdated = null;
function classifyWx(c) {
  const code = c.weather_code, wind = c.wind_speed_10m || 0, gust = c.wind_gusts_10m || 0;
  if ((gust >= 75 || wind >= 50) && code >= 51) return 'storm';
  if (code >= 95) return 'thunder';
  if (code === 65 || code === 67 || code === 82) return 'heavyrain';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 71 || code === 3) return 'overcast';
  if (code === 1 || code === 2) return 'partly';
  return 'clear';
}
const bkkNow = () => { const d = new Date(); return { h: (d.getUTCHours() + 7) % 24, m: d.getUTCMinutes() }; };
const bkkMinutes = () => { const t = bkkNow(); return t.h * 60 + t.m; };
const bkkClock = () => { const t = bkkNow(); return String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0'); };
const hm = s => { const m = /T(\d\d):(\d\d)/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const fmtMin = v => v == null ? '–' : String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
function dayPhase() {
  const now = bkkMinutes();
  const rise = wxLive && wxLive.rise != null ? wxLive.rise : 355, set = wxLive && wxLive.set != null ? wxLive.set : 1065;
  if (now >= rise - 35 && now < rise + 40) return 'dawn';
  if (now >= set - 50 && now < set + 25) return 'dusk';
  if (now >= rise + 40 && now < set - 50) return 'day';
  return 'night';
}
function moonPhase() { const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); let a = ((Date.now() - ref) / 86400000) % syn; if (a < 0) a += syn; return a / syn; }
async function fetchWeather() {
  const key = state.settings.city in CITIES ? state.settings.city : 'hcm', c = CITIES[key];
  if (!wxLive || wxLive.city !== key) $('#wxText').textContent = '…';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code,is_day,cloud_cover,precipitation,wind_speed_10m,wind_gusts_10m&daily=sunrise,sunset&forecast_days=1&timezone=Asia%2FBangkok`;
    const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
    const j = await r.json(), cur = j.current;
    if (key !== state.settings.city) return; // city changed while loading
    wxLive = { city: key, kind: classifyWx(cur), temp: Math.round(cur.temperature_2m), wind: Math.round(cur.wind_speed_10m || 0),
      cloud: cur.cloud_cover ?? 50, precip: cur.precipitation ?? 0,
      rise: hm(j.daily && j.daily.sunrise && j.daily.sunrise[0]), set: hm(j.daily && j.daily.sunset && j.daily.sunset[0]) };
    wxUpdated = bkkClock(); wxErr = false;
  } catch (err) {
    console.warn('weather', err); wxErr = true;
    if (wxLive && wxLive.city !== key) wxLive = null;
  }
  updateWeather();
}
const SCENES = {
  sunny: { kind: 'clear', icon: '☀️', mood: 'sunny', fixed: true }, cloudy: { kind: 'cloudy', icon: '☁️', mood: 'cloudy' }, rain: { kind: 'rain', icon: '🌧️', mood: 'rain' }, thunder: { kind: 'thunder', icon: '⛈️', mood: 'storm' },
  snow: { kind: 'snow', icon: '❄️', mood: 'snow' }, rainbow: { kind: 'rainbow', icon: '🌈', mood: 'rainbow' }, aurora: { kind: 'aurora', icon: '🌌', phase: 'night', mood: 'aurora', fixed: true },
  stars: { kind: 'stars', icon: '✨', phase: 'night', mood: 'night', fixed: true }, sunset: { kind: 'clear', icon: '🌇', phase: 'dusk', mood: 'sunset', fixed: true }, sakura: { kind: 'sakura', icon: '🌸', mood: 'sakura' }
};
function updateWeather() {
  if (state.settings.scene && !SCENES[state.settings.scene]) state.settings.scene = 'live';
  const scene = SCENES[state.settings.scene];
  if (scene) { // a scene the user picked
    const isDarkS = state.settings.theme === 'dark', ph = scene.fixed ? (scene.phase || 'day') : (isDarkS ? 'night' : (scene.phase || 'day')); // sunny, aurora and starry night keep their own light
    $('#wxIcon').textContent = scene.icon;
    $('#wxText').textContent = bkkClock();
    $('#wxText').title = wxLive ? t('wxTip', { city: cityName(wxLive.city), temp: wxLive.temp, label: t('wx_' + wxLive.kind), c: wxLive.cloud, r: wxLive.precip, w: wxLive.wind, sr: fmtMin(wxLive.rise), ss: fmtMin(wxLive.set), u: wxUpdated }) : '';
    setMusicMood(scene.mood);
    Sky.set({ kind: scene.kind, phase: ph, dark: scene.fixed ? false : isDarkS, cloud: 40, precip: 1.5, wind: 8, moon: moonPhase() });
    return;
  }
  const kind = wxLive ? wxLive.kind : 'clear', phase = dayPhase(), info = WX[kind];
  const isDark = state.settings.theme === 'dark', skyPhase = isDark ? 'night' : phase;
  let icon = info.icon, label = t('wx_' + kind);
  if (phase === 'night') { if (kind === 'clear') { icon = '🌙'; label = t('clearNight'); } else if (kind === 'partly') { icon = '☁️'; label = t('cloudyNight'); } }
  if (kind === 'clear' && phase === 'dusk') { icon = '🌇'; label = t('sunset'); }
  if (kind === 'clear' && phase === 'dawn') { icon = '🌅'; label = t('sunrise'); }
  $('#wxIcon').textContent = icon;
  const clock = bkkClock();
  $('#wxText').textContent = wxLive ? `${wxLive.temp}°C · ${label} · ${clock}` : (wxErr ? `${t('noWx')} · ${clock}` : '…');
  $('#wxText').title = wxLive
    ? t('wxTip', { city: cityName(wxLive.city), temp: wxLive.temp, label: t('wx_' + kind), c: wxLive.cloud, r: wxLive.precip, w: wxLive.wind, sr: fmtMin(wxLive.rise), ss: fmtMin(wxLive.set), u: wxUpdated })
    : t('wxFail');
  setMusicMood(musicMoodFor(kind, skyPhase === 'night', skyPhase === 'dusk' || skyPhase === 'dawn'));
  Sky.set({ kind, phase: skyPhase, dark: isDark, cloud: wxLive ? wxLive.cloud : 15, precip: wxLive ? wxLive.precip : 0, wind: wxLive ? wxLive.wind : 6, moon: moonPhase() });
}
function playThunder() {
  if (!sfxOn()) return;
  const t = actx.currentTime, src = actx.createBufferSource(); src.buffer = noiseBuf(3);
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(90, t + 2.6);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.08); g.gain.linearRampToValueAtTime(0.5, t + 0.5); g.gain.linearRampToValueAtTime(0.7, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
  src.connect(lp); lp.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + 3);
}
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const Sky = (() => {
  /* calm, minimal sky: soft gradient, flat clouds, gentle weather and a few special scenes */
  const cv = $('#sky'), ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, P = { kind: 'clear', phase: 'day', cloud: 15, precip: 0, wind: 6, moon: .5, dark: false }, sig = '';
  let cfg = null, grad = null, rainCol = '', land = null, hills = [], clouds = [], drops = [], stars = [], fogs = [], rings = [], sparks = [];
  let flakes = [], petals = [], curtains = [], shoot = null, nextShoot = 200;
  let flash = 0, nextBolt = 200, t = 0, last = performance.now(), sunPulse = 0, orb = null, warm = 1;
  const PAL = {
    clear: ['#f8dccd', '#f6ece6'], partly: ['#f2dcd3', '#f2e8e3'], overcast: ['#e3d9d6', '#efe8e4'], fog: ['#e9e3e1', '#f2edeb'],
    drizzle: ['#ddd4d6', '#ece5e2'], rain: ['#d1cad1', '#e3dcda'], heavyrain: ['#c4bcc6', '#d9d1d1'], thunder: ['#b6abb5', '#d0c5c4'], storm: ['#a89ea9', '#c5babb'],
    cloudy: ['#d6ccca', '#e9e1dd'], snow: ['#dce1ea', '#f0f1f5'], rainbow: ['#d7e3ee', '#f7ece5'], aurora: ['#0d1630', '#272c55'], sakura: ['#f8d9e1', '#fbf0ee'], stars: ['#121836', '#342b50']
  };
  const HEAVY = { clear: 0, partly: .2, overcast: .55, fog: .5, drizzle: .6, rain: .7, heavyrain: .8, thunder: .85, storm: .9, cloudy: .4, snow: .4, rainbow: .1, aurora: 0, sakura: 0, stars: 0 };
  const CFG = {
    clear: { sun: 1, clouds: 2 }, partly: { sun: .9, clouds: 4 }, overcast: { sun: .2, clouds: 7 }, fog: { sun: .1, clouds: 3, fog: 1 },
    drizzle: { clouds: 6, rain: 50, len: 9, speed: 6, wind: .4 }, rain: { clouds: 7, rain: 120, len: 14, speed: 10, wind: .9 },
    heavyrain: { clouds: 8, rain: 200, len: 18, speed: 13, wind: 1.6 }, thunder: { clouds: 8, rain: 190, len: 18, speed: 13, wind: 1.8, lightning: 1 },
    storm: { clouds: 9, rain: 300, len: 22, speed: 16, wind: 5, lightning: .6, cloudSpeed: 4 },
    cloudy: { sun: .25, clouds: 16 }, snow: { clouds: 5, snow: 130 }, rainbow: { sun: .8, clouds: 3, rainbow: 1 }, aurora: { aurora: 1 }, sakura: { sun: .7, clouds: 2, petals: 45 }, stars: { shooting: 1 }
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hillY = (i, px) => { const hl = hills[i]; let y = h * hl.b; for (const [a, f, ph] of hl.waves) y += a * Math.sin(px * f + ph); return y; };
  function build() {
    if (!w || !h) return;
    const kind = P.kind, phase = P.phase, night = phase === 'night', low = phase === 'dawn' || phase === 'dusk', heavy = HEAVY[kind] || 0;
    cfg = Object.assign({}, CFG[kind] || CFG.clear);
    warm = 1 - heavy * .65;
    const cc = clamp(P.cloud, 0, 100) / 100;
    if (kind === 'clear') cfg.clouds = 1 + Math.round(cc * 2);
    else if (kind === 'partly') cfg.clouds = 3 + Math.round(cc * 2);
    if (cfg.rain) { cfg.rain *= clamp(.6 + P.precip / 3, .6, 1.6); cfg.wind = (cfg.wind || 1) * clamp(P.wind / 14, .3, 3); }
    cfg.cloudSpeed = (cfg.cloudSpeed || 1) * clamp(P.wind / 10, .4, 3);
    let [top, bot] = PAL[kind] || PAL.clear;
    if (phase === 'dawn') { top = mixHex(top, '#c4b3dc', .45 * warm); bot = mixHex(bot, '#ffd0b2', .55 * warm); }
    if (phase === 'dusk') { top = mixHex(top, '#a08bbf', .5 * warm); bot = mixHex(bot, '#ffb898', .6 * warm); }
    if (night) { top = mixHex(top, '#1e2140', .84); bot = mixHex(bot, '#46395a', .74); }
    if (P.dark) { top = mixHex(top, '#15131f', .2); bot = mixHex(bot, '#1d1726', .2); }
    grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, top); grad.addColorStop(1, bot);
    rainCol = night ? 'rgba(210,215,245,.32)' : 'rgba(120,110,140,.3)';
    let tone = kind === 'cloudy' ? '#fcf9f7' : heavy < .3 ? '#fffaf7' : heavy < .6 ? '#f5efed' : mixHex('#ece5e7', '#9a8f99', (heavy - .5) * .8);
    if (low) tone = mixHex(tone, '#f8c4b0', .35 * warm);
    if (night) tone = mixHex(tone, '#5c5878', .62);
    const area = Math.max(.4, (w * h) / (900 * 900));
    clouds = [...Array(cfg.clouds || 0)].map((_, i) => {
      const s = rnd(.7, 1.6) * (w > 700 ? 1 : .7);
      return { x: rnd(-150, w), y: rnd(10, h * (cfg.rain ? .3 : kind === 'cloudy' ? .7 : .42)), s, v: rnd(.06, .16) * cfg.cloudSpeed * (s / 1.2), a: rnd(.65, .9) * (night ? .8 : 1), col: tone, bump: 0 };
    }).sort((a, b) => a.s - b.s);
    if (kind === 'cloudy') clouds = [...Array(46)].map((_, i) => { // thick clouds over the top two thirds
      const big = i < 38, s = (big ? rnd(1.3, 2.8) : rnd(.8, 1.4)) * (w > 700 ? 1 : .7);
      return { x: rnd(-280, w + 40), y: big ? rnd(-55, h * .55) : rnd(h * .5, h * .66), s, v: rnd(.05, .12) * cfg.cloudSpeed, a: rnd(.78, .96) * (night ? .85 : 1), col: tone, bump: 0 };
    }).sort((a, b) => a.s - b.s);
    drops = [...Array(Math.round((cfg.rain || 0) * area))].map(() => ({ x: rnd(-100, w + 100), y: rnd(-h, h), l: (cfg.len || 15) * rnd(.8, 1.2), v: (cfg.speed || 10) * rnd(.85, 1.15) }));
    const starN = kind === 'stars' ? 180 : kind === 'aurora' ? 110 : !night ? 0 : kind === 'clear' ? 70 : kind === 'partly' ? 35 : 0;
    stars = [...Array(Math.round(starN * area))].map(() => ({ x: rnd(0, w), y: rnd(0, h * .62), r: rnd(.5, 1.4), p: rnd(0, 6.28), s: rnd(.01, .03) }));
    fogs = kind === 'cloudy' ? [...Array(5)].map((_, i) => ({ x: rnd(-w * .3, w), y: h * (.06 + i * .14), rw: rnd(w * .5, w * .85), rh: rnd(55, 90), v: rnd(.1, .25) * (i % 2 ? 1 : -1) }))
      : cfg.fog ? [...Array(3)].map((_, i) => ({ x: rnd(-w * .3, w), y: h * (.3 + i * .18), rw: rnd(w * .5, w * .8), rh: rnd(50, 80), v: rnd(.1, .25) * (i % 2 ? 1 : -1) })) : [];
    flash = 0; nextBolt = t + rnd(150, 400);
    flakes = [...Array(Math.round((cfg.snow || 0) * area))].map(() => ({ x: rnd(0, w), y: rnd(-h, h), r: rnd(1.2, 3.4), v: rnd(.35, 1.1), p: rnd(0, 6.28), sw: rnd(.2, .7) }));
    petals = [...Array(Math.round((cfg.petals || 0) * area))].map(() => ({ x: rnd(0, w), y: rnd(-h, h), s: rnd(4, 8), v: rnd(.45, 1.1), p: rnd(0, 6.28), rot: rnd(0, 6.28), vr: rnd(-.04, .04), sw: rnd(.4, 1.2) }));
    curtains = cfg.aurora ? [[90, 255, 190], [70, 205, 255], [185, 125, 255]].map((col, i) => {
      const g = document.createElement('canvas'); g.width = 1; g.height = 160; const gx = g.getContext('2d'), gr = gx.createLinearGradient(0, 0, 0, 160);
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.15, `rgba(${col},.55)`); gr.addColorStop(.45, `rgba(${col},.22)`); gr.addColorStop(1, `rgba(${col},0)`);
      gx.fillStyle = gr; gx.fillRect(0, 0, 1, 160); return { g, y: .16 + i * .08, amp: 26 + i * 10, f: rnd(.004, .007), sp: rnd(.006, .012), ph: rnd(0, 6.28), len: 120 + i * 30 };
    }) : [];
    shoot = null; nextShoot = t + rnd(120, 300);
    orb = null;
  }
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; h = r.height;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }
  function cloudShape() { // flat cloud: one rounded base + two puffs, filled as a single shape
    ctx.beginPath();
    ctx.moveTo(15, 30); ctx.arcTo(120, 30, 120, 60, 15); ctx.arcTo(120, 60, 0, 60, 15); ctx.arcTo(0, 60, 0, 30, 15); ctx.arcTo(0, 30, 120, 30, 15); ctx.closePath();
    ctx.moveTo(62, 32); ctx.arc(42, 32, 20, 0, Math.PI * 2);
    ctx.moveTo(100, 28); ctx.arc(74, 28, 26, 0, Math.PI * 2);
    ctx.fill('nonzero');
  }
  function drawMoon(cx, cy, r, phase, vis) {
    const g = ctx.createRadialGradient(cx, cy, r * .6, cx, cy, r * 3.4);
    g.addColorStop(0, `rgba(255,240,210,${.2 * vis})`); g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 3.4, 0, 6.29); ctx.fill();
    ctx.globalAlpha = vis;
    ctx.fillStyle = 'rgba(255,244,214,.12)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.29); ctx.fill();
    const k = Math.cos(phase * 2 * Math.PI), rightLit = phase < .5, crescent = k > 0;
    if (phase > .015 && phase < .985) {
      ctx.fillStyle = '#fff1d6'; ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !rightLit);
      ctx.ellipse(cx, cy, Math.max(.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, rightLit === crescent);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function draw(dt) {
    const kind = P.kind, phase = P.phase, night = phase === 'night', low = phase === 'dawn' || phase === 'dusk';
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    for (const s of stars) { s.p += s.s * dt; ctx.globalAlpha = .35 + .4 * (0.5 + 0.5 * Math.sin(s.p)); ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill(); }
    ctx.globalAlpha = 1;
    sunPulse = Math.max(0, sunPulse - .025 * dt);
    const pulse = 1 + .16 * Math.sin(sunPulse * Math.PI);
    if (night) {
      const vis = kind === 'clear' || kind === 'stars' ? 1 : kind === 'aurora' ? .7 : kind === 'partly' ? .9 : kind === 'overcast' || kind === 'fog' || kind === 'snow' ? .35 : .12;
      orb = { x: w * .92, y: Math.min(92, h * .12), r: 24 };
      drawMoon(orb.x, orb.y, orb.r * pulse, P.moon, vis);
    } else if (cfg.sun) {
      const s = cfg.sun * (low ? warm : 1);
      orb = { x: low ? w * .93 : w * .9, y: low ? h * .74 : Math.min(96, h * .13), r: low ? 34 : 28 };
      const halo = ctx.createRadialGradient(orb.x, orb.y, orb.r * .8, orb.x, orb.y, orb.r * 4.2 * pulse);
      const hc = low ? '255,180,145' : '255,228,190';
      halo.addColorStop(0, `rgba(${hc},${.45 * s})`); halo.addColorStop(1, `rgba(${hc},0)`);
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r * 4.2 * pulse, 0, 6.29); ctx.fill();
      if (cfg.sun > .5) { ctx.globalAlpha = Math.min(1, s * 1.1); ctx.fillStyle = low ? '#ffb994' : '#ffe2b4'; ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r * pulse, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; }
    } else orb = null;
    for (const cu of curtains) { // aurora: soft glowing curtains
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let x = 0; x <= w; x += 5) {
        const y = h * cu.y + Math.sin(x * cu.f + t * cu.sp + cu.ph) * cu.amp + Math.sin(x * cu.f * 2.7 - t * cu.sp * 1.3) * cu.amp * .35;
        ctx.globalAlpha = .45 + .45 * Math.sin(x * .011 + t * .02 + cu.ph);
        ctx.drawImage(cu.g, x, y, 6, cu.len * (.8 + .3 * Math.sin(x * .02 + t * .01)));
      }
      ctx.restore();
    }
    if (cfg.rainbow) {
      const cx = w * .8, cy = h * 1.02, R = Math.min(w, h) * .72;
      ['#ff9aa2', '#ffc79a', '#fff09a', '#b5ead7', '#9ad0ff', '#c7b3ff'].forEach((col, i) => {
        ctx.strokeStyle = col; ctx.globalAlpha = .38; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(cx, cy, R - i * 14, Math.PI, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    if (cfg.shooting && (night || kind === 'stars')) {
      if (!shoot && t > nextShoot) shoot = { x: rnd(w * .1, w * .6), y: rnd(10, h * .3), life: 40 };
      if (shoot) {
        shoot.x += 9 * dt; shoot.y += 3.6 * dt; shoot.life -= dt;
        const g = ctx.createLinearGradient(shoot.x - 90, shoot.y - 36, shoot.x, shoot.y);
        g.addColorStop(0, 'rgba(255,250,230,0)'); g.addColorStop(1, `rgba(255,250,230,${Math.min(1, shoot.life / 20)})`);
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(shoot.x - 90, shoot.y - 36); ctx.lineTo(shoot.x, shoot.y); ctx.stroke();
        if (shoot.life <= 0) { shoot = null; nextShoot = t + rnd(220, 600); }
      }
    }
    for (const c of clouds) {
      c.x += c.v * dt; if (c.x > w + 20) { c.x = -130 * c.s - rnd(0, 120); }
      c.bump = Math.max(0, c.bump - .022 * dt);
      const b = Math.sin(c.bump * Math.PI), sc = c.s * (1 + .1 * b);
      ctx.save(); ctx.translate(c.x + 60 * c.s, c.y + 40 * c.s - 10 * b); ctx.scale(sc, sc); ctx.translate(-60, -40);
      ctx.globalAlpha = c.a; ctx.fillStyle = c.col; cloudShape(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const f of fogs) {
      f.x += f.v * dt; if (f.x > w + f.rw) f.x = -f.rw; if (f.x < -f.rw * 2) f.x = w;
      const g = ctx.createRadialGradient(f.x + f.rw / 2, f.y, 5, f.x + f.rw / 2, f.y, f.rw / 2);
      const fc = night ? '160,155,185' : '255,252,250';
      g.addColorStop(0, `rgba(${fc},.4)`); g.addColorStop(1, `rgba(${fc},0)`);
      ctx.save(); ctx.translate(0, f.y); ctx.scale(1, f.rh / (f.rw / 2)); ctx.translate(0, -f.y);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x + f.rw / 2, f.y, f.rw / 2, 0, 6.29); ctx.fill(); ctx.restore();
    }
    if (drops.length) {
      const wind = cfg.wind || 0;
      ctx.strokeStyle = rainCol; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath();
      for (const d of drops) {
        d.y += d.v * dt; d.x += wind * dt * (d.v / 12);
        if (d.y > h) { d.y = rnd(-80, -10); d.x = rnd(-100 - wind * 40, w + 100); }
        const k = d.l / d.v;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + wind * k * (d.v / 12), d.y + d.l);
      }
      ctx.stroke();
    }
    for (const f of flakes) { // snow
      f.p += .02 * dt; f.y += f.v * dt; f.x += Math.sin(f.p) * f.sw * dt;
      if (f.y > h + 5) { f.y = rnd(-40, -5); f.x = rnd(0, w); }
      ctx.fillStyle = night ? 'rgba(230,235,255,.85)' : 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.29); ctx.fill();
    }
    for (const q of petals) { // cherry blossom petals
      q.p += .02 * dt; q.y += q.v * dt; q.x += (Math.sin(q.p) * q.sw + .35) * dt; q.rot += q.vr * dt;
      if (q.y > h + 10 || q.x > w + 20) { q.y = rnd(-40, -5); q.x = rnd(-40, w); }
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.scale(1, .55 + .35 * Math.abs(Math.sin(q.p * 1.7)));
      ctx.fillStyle = '#f6b3c6'; ctx.beginPath(); ctx.moveTo(0, -q.s); ctx.quadraticCurveTo(q.s, -q.s * .2, 0, q.s); ctx.quadraticCurveTo(-q.s, -q.s * .2, 0, -q.s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-q.s * .15, -q.s * .2, q.s * .2, q.s * .45, 0, 0, 6.29); ctx.fill();
      ctx.restore();
    }
    if (cfg.lightning) {
      if (t > nextBolt) { flash = 1; nextBolt = t + rnd(240, 560) / cfg.lightning; setTimeout(playThunder, rnd(300, 1100)); }
      if (flash > .01) { ctx.fillStyle = `rgba(255,255,255,${flash * .35})`; ctx.fillRect(0, 0, w, h); flash *= Math.pow(.88, dt); }
    }
    // little click effects
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.r += 1.5 * dt; r.a -= .022 * dt;
      if (r.a <= 0) { rings.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(${r.col},${r.a})`; ctx.lineWidth = 1.5; ctx.beginPath();
      if (r.flat) ctx.ellipse(r.x, r.y, r.r * 1.8, r.r * .45, 0, 0, 6.29); else ctx.arc(r.x, r.y, r.r, 0, 6.29);
      ctx.stroke();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .05 * dt; s.a -= .025 * dt;
      if (s.a <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${s.col},${s.a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill();
    }
  }
  function tick(now) {
    const dt = Math.min(3, (now - last) / 16.67); last = now; t += dt;
    if (!document.hidden && w) draw(dt);
    requestAnimationFrame(tick);
  }
  return {
    ready: false,
    init() { new ResizeObserver(resize).observe(cv.parentElement); resize(); this.ready = true; requestAnimationFrame(tick); },
    set(p) {
      const s = [p.kind, p.phase, p.dark ? 1 : 0, Math.round(p.cloud / 10), Math.round(p.precip * 2), Math.round(p.wind / 5), Math.round(p.moon * 60)].join('|');
      P = p; if (s === sig && cfg) return; sig = s; build();
    },
    poke(x, y) {
      if (!cfg) return;
      let hit = null;
      if (orb && Math.hypot(x - orb.x, y - orb.y) < orb.r + 16) { sunPulse = 1; hit = P.phase === 'night' ? 'moon' : 'sun'; }
      if (!hit) for (let i = clouds.length - 1; i >= 0; i--) {
        const c = clouds[i];
        if (x >= c.x && x <= c.x + 120 * c.s && y >= c.y + 15 * c.s && y <= c.y + 60 * c.s) { c.bump = 1; hit = 'cloud'; break; }
      }
      const night = P.phase === 'night', col = hit === 'sun' ? '255,205,150' : night ? '232,228,255' : '255,255,255';
      rings.push({ x, y, r: 3, a: .55, col, flat: hit === 'hill' });
      if (hit === 'hill') setTimeout(() => rings.push({ x, y, r: 3, a: .4, col, flat: true }), 160);
      if (hit === 'cloud' || !hit) for (let k = 0; k < 7; k++) sparks.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(-2.2, -.5), a: .9, r: rnd(1.2, 2.4), col: hit === 'cloud' ? '255,255,255' : night ? '255,240,200' : '255,236,214' });
      playBlip(hit);
    }
  };
})();
function playBlip(kind) {
  if (!sfxOn()) return;
  const tm = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  const f = { sun: 784, moon: 659, cloud: 988, hill: 523 }[kind] || 1175;
  o.type = 'sine'; o.frequency.setValueAtTime(f, tm); o.frequency.exponentialRampToValueAtTime(f * 1.5, tm + .12);
  g.gain.setValueAtTime(0.0001, tm); g.gain.linearRampToValueAtTime(.12, tm + .01); g.gain.exponentialRampToValueAtTime(0.0001, tm + .35);
  o.connect(g); g.connect(sfxBus); o.start(tm); o.stop(tm + .4);
}

/* ============ free drawing ============ */
let drawTool = null, drawSession = null;
const DRAW_TOOLS = { pen: { mul: 1, alpha: 1, label: 'Pen' }, marker: { mul: 1.8, alpha: .7, label: 'Marker' }, pencil: { mul: .6, alpha: .95, pencil: true, label: 'Pencil' }, eraser: { label: 'Eraser' } };
const SWATCHES = ['#5e3f37', '#c4836f', '#f48ea0', '#ffb547', '#ffe08a', '#8cc777', '#7fb3e6', '#b19be0', '#ffffff', '#222222'];
const f1 = n => Math.round(n * 10) / 10;
const eraserR = () => state.drawDefaults.size * 1.2 + 6;
function toPageClamped(ev) { const p = toPage(ev); return { x: clamp(p.x, 0, W), y: clamp(p.y, 0, H) }; }
function strokeLayers(s) {
  const d = strokePath(s.pts);
  if (!s.pencil) return [{ d, w: s.size, a: s.alpha, cap: 'round' }];
  const w = s.size, k = Math.max(.6, w / 3), q = n => f1(n * k);
  return [ // graphite look: soft continuous core + fine speckled grain on both edges
    { d, w: f1(w * .75), a: s.alpha * .5, cap: 'round' },
    { d, w: f1(w * .5), a: s.alpha * .6, cap: 'butt', dash: `${q(.6)} ${q(1.1)} ${q(.3)} ${q(.8)} ${q(1.2)} ${q(.9)}`, tx: f1(w * .18), ty: f1(w * .12) },
    { d, w: f1(w * .4), a: s.alpha * .55, cap: 'butt', dash: `${q(.9)} ${q(.7)} ${q(.4)} ${q(1.3)}`, tx: f1(-w * .15), ty: f1(-w * .2) },
    { d, w: f1(w * .3), a: s.alpha * .45, cap: 'butt', dash: `${q(.3)} ${q(.5)} ${q(.7)} ${q(.9)} ${q(.4)} ${q(.6)}` }
  ];
}
const layerSVG = (L, color) => `<path d="${L.d}" stroke="${color}" stroke-width="${L.w}" stroke-opacity="${L.a}" fill="none" stroke-linecap="${L.cap}" stroke-linejoin="round"${L.dash ? ` stroke-dasharray="${L.dash}"` : ''}${L.tx ? ` transform="translate(${L.tx} ${L.ty})"` : ''}/>`;
function strokesSVG(e) { return e.strokes.map(st => strokeLayers(st).map(L => layerSVG(L, st.color)).join('')).join(''); }
function strokePath(pts) {
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i + 1]; d += `Q${x} ${y} ${f1((x + nx) / 2)} ${f1((y + ny) / 2)}`; }
  const l = pts[pts.length - 1]; return d + `L${l[0]} ${l[1]}`;
}
function drawStrokesAbs(e) {
  const sx = e.w / e.vw, sy = e.h / e.vh, k = (sx + sy) / 2;
  return e.strokes.map(s => ({ ...s, size: s.size * k, pts: s.pts.map(([x, y]) => [e.x + x * sx, e.y + y * sy]) }));
}
function setDrawStrokes(e, abs) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9, pad = 2;
  for (const s of abs) { const p = s.size / 2 + 2; pad = Math.max(pad, p); for (const [x, y] of s.pts) { a = Math.min(a, x - p); b = Math.min(b, y - p); c = Math.max(c, x + p); d = Math.max(d, y + p); } }
  e.x = a; e.y = b; e.w = Math.max(4, c - a); e.h = Math.max(4, d - b); e.vw = e.w; e.vh = e.h; e.pad = pad;
  e.strokes = abs.map(s => { const o = { color: s.color, alpha: s.alpha, size: f1(s.size), pts: s.pts.map(([x, y]) => [f1(x - e.x), f1(y - e.y)]) }; if (s.pencil) o.pencil = true; return o; });
}
let strokeSel = null; // { id, i }: one stroke picked inside a drawing
function drawNode(e, d) {
  const picked = strokeSel && strokeSel.id === e.id ? strokeSel.i : -1;
  const paths = e.strokes.map((st, i) => (i === picked ? `<path d="${strokePath(st.pts)}" stroke="#c4836f" stroke-opacity=".35" stroke-width="${st.size + 9}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 4"/>` : '') + strokeLayers(st).map(L => layerSVG(L, st.color)).join('')).join('');
  const hits = e.strokes.map((s, i) => `<path class="hit" data-si="${i}" d="${strokePath(s.pts)}" stroke="transparent" stroke-width="${Math.max(14, s.size + 8)}" fill="none" stroke-linecap="round"/>`).join('');
  d.innerHTML = `<svg style="width:100%;height:100%" viewBox="0 0 ${e.vw} ${e.vh}" preserveAspectRatio="none">${paths}${hits}</svg>`;
}
function startStroke(ev) {
  const pt = toPageClamped(ev);
  if (drawTool === 'eraser') { drag = { mode: 'erase', pushed: false }; eraseAt(pt); return; }
  const t = DRAW_TOOLS[drawTool], dd = state.drawDefaults, size = dd.size * t.mul;
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'liveStroke'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const pts = [[f1(pt.x), f1(pt.y)]];
  svg.innerHTML = strokeLayers({ pts, size, alpha: t.alpha, pencil: !!t.pencil }).map(L => layerSVG(L, dd.color)).join('');
  pageEl.appendChild(svg);
  drag = { mode: 'stroke', pts, paths: [...svg.querySelectorAll('path')], svg, color: dd.color, size, alpha: t.alpha, pencil: !!t.pencil };
}
function moveStroke(ev) {
  const pt = toPageClamped(ev); moveBrushCursor(pt);
  if (drag.mode === 'erase') { eraseAt(pt); return; }
  const l = drag.pts[drag.pts.length - 1];
  if (Math.hypot(pt.x - l[0], pt.y - l[1]) >= 1.2) { drag.pts.push([f1(pt.x), f1(pt.y)]); const dd = strokePath(drag.pts); drag.paths.forEach(p => p.setAttribute('d', dd)); }
}
function commitStroke(d) {
  d.svg.remove();
  pushHistory();
  const a = album();
  let e = drawSession && findEl(drawSession), abs;
  if (!e || e.type !== 'draw' || e.page !== page()) {
    a.counters.draw = (a.counters.draw || 0) + 1;
    e = { id: uid(), type: 'draw', name: 'draw' + a.counters.draw, page: page(), z: maxZ(page()) + 1, strokes: [] };
    a.elements.push(e); drawSession = e.id; abs = [];
  } else abs = drawStrokesAbs(e);
  abs.push({ color: d.color, size: d.size, alpha: d.alpha, pts: d.pts, pencil: d.pencil });
  setDrawStrokes(e, abs);
  if (domOf(e.id)) rerenderEl(e); else pageEl.appendChild(elNode(e));
  renderLayers(); renderAlbums(); markDirty();
}
function eraseAt(pt) {
  const r = eraserR();
  let changed = false;
  for (const e of pageEls().filter(x => x.type === 'draw')) {
    const abs = drawStrokesAbs(e);
    const keep = abs.filter(s => !s.pts.some(([x, y]) => Math.hypot(x - pt.x, y - pt.y) < r + s.size / 2));
    if (keep.length === abs.length) continue;
    if (!drag.pushed) { pushHistory(); drag.pushed = true; }
    changed = true;
    if (!keep.length) { album().elements = album().elements.filter(x => x.id !== e.id); const n = domOf(e.id); if (n) n.remove(); if (selectedId === e.id) selectedId = null; }
    else { setDrawStrokes(e, keep); rerenderEl(e); }
  }
  if (changed) { renderLayers(); renderAlbums(); markDirty(); }
}
function moveBrushCursor(pt) {
  const c = $('#brushCursor'); if (!c || !drawTool) return;
  const dd = state.drawDefaults;
  const size = drawTool === 'eraser' ? eraserR() * 2 : Math.max(4, dd.size * DRAW_TOOLS[drawTool].mul);
  c.style.left = pt.x + 'px'; c.style.top = pt.y + 'px'; c.style.width = c.style.height = size + 'px';
  c.classList.toggle('eraser', drawTool === 'eraser');
  c.style.background = drawTool === 'eraser' ? 'rgba(255,255,255,.35)' : dd.color + '40';
}
function setDrawTool(tool) {
  if (tool && tool === drawTool) tool = null;
  if (tool) { if (lineMode) setLineMode(false); if (crop) endCrop(); finishEdit(); if (!drawTool) { drawSession = null; select(null); } }
  drawTool = tool;
  document.body.classList.toggle('drawmode', !!tool);
  syncDrawControls();
}
function applyDraw(patch) {
  const e = !drawTool && getSel().length === 1 && findEl(selectedId);
  if (e && e.type === 'draw' && patch.color) { // recolour what was picked; the pen colour for new strokes stays as it was
    pushHistory('dcolor');
    if (strokeSel && strokeSel.id === e.id && e.strokes[strokeSel.i]) e.strokes[strokeSel.i].color = patch.color;
    else e.strokes.forEach(s => s.color = patch.color);
    rerenderEl(e); renderLayers(); syncDrawControls(); markDirty(); return;
  }
  Object.assign(state.drawDefaults, patch);
  syncDrawControls(); markDirty();
}
function pickedDrawColor() {
  const e = !drawTool && getSel().length === 1 && findEl(selectedId);
  if (!e || e.type !== 'draw') return null;
  const st = strokeSel && strokeSel.id === e.id ? e.strokes[strokeSel.i] : e.strokes[0];
  return st ? st.color : null;
}
function syncDrawControls() {
  const dd = state.drawDefaults;
  $$('#drawTools button').forEach(b => b.classList.toggle('on', b.dataset.tool === drawTool));
  $('#drawState').textContent = drawTool ? t('toolOn', { n: t('tool_' + drawTool) }) : t('off');
  const shown = pickedDrawColor() || dd.color;
  $$('#drawSwatches button').forEach(b => b.classList.toggle('on', b.dataset.c === shown));
  $('#drawColor').value = shown; $('#drawSize').value = dd.size; $('#drawSizeVal').textContent = dd.size;
}

/* ============ bindings for the new tools ============ */

function bindExtras() {
  // line
  $('#lineBtn').onclick = () => setLineMode(!lineMode);
  $('#lineColor').addEventListener('input', ev => applyLine({ color: ev.target.value }, 'lcolor'));
  $('#lineWidth').addEventListener('input', ev => { $('#lineWidthVal').textContent = ev.target.value; applyLine({ width: +ev.target.value }, 'lwidth'); });
  $$('#lineDash button').forEach(b => b.onclick = () => applyLine({ dash: b.dataset.v }));
  const cs = $('#capStart'), ce = $('#capEnd');
  CAPS.forEach(k => {
    const a = document.createElement('button'); a.dataset.cap = k; a.title = t('cap_' + k); a.innerHTML = capIcon(k, true); a.onclick = () => applyLine({ start: k }); cs.appendChild(a);
    const b = document.createElement('button'); b.dataset.cap = k; b.title = t('cap_' + k); b.innerHTML = capIcon(k, false); b.onclick = () => applyLine({ end: k }); ce.appendChild(b);
  });
  // crop
  $('#cropBtn').onclick = startCrop;
  $('#cropApply').onclick = applyCrop;
  $('#cropCancel').onclick = endCrop;
  $$('#cropBar [data-r]').forEach(b => b.onclick = () => setCropRatio(+b.dataset.r));
  // palette
  const ps = $('#palStk'), pe = $('#palEmo');
  const palBtn = (kind, key, inner, title) => {
    const b = document.createElement('button'); b.draggable = true; b.title = title; b.innerHTML = inner;
    b.onclick = () => addPaletteItem(kind, key);
    b.addEventListener('dragstart', ev => { ev.dataTransfer.setData('application/x-dii', JSON.stringify({ kind, key })); ev.dataTransfer.effectAllowed = 'copy'; });
    return b;
  };
  Object.keys(STICKERS).forEach(k => ps.appendChild(palBtn('sticker', k, `<img src="${stickerURL(k)}" alt="${k}">`, k)));
  EMOJI.forEach(ch => pe.appendChild(palBtn('emoji', ch, ch, ch)));
  $$('#palTabs button').forEach(b => b.onclick = () => {
    $$('#palTabs button').forEach(x => x.classList.toggle('on', x === b));
    ps.style.display = b.dataset.t === 'stk' ? '' : 'none'; pe.style.display = b.dataset.t === 'emo' ? '' : 'none';
    $('#palMine').style.display = b.dataset.t === 'mine' ? '' : 'none'; if (b.dataset.t === 'mine') renderMine();
  });
  // weather
  const cityS = $('#citySel');
  Object.entries(CITIES).forEach(([k, c]) => cityS.add(new Option(cityName(k), k)));
  cityS.onchange = () => { state.settings.city = cityS.value; markDirty(); fetchWeather(); };
  const scS = $('#sceneSel');
  ['live', ...Object.keys(SCENES)].forEach(k => scS.add(new Option(k === 'live' ? t('scene_live') : SCENES[k].icon + ' ' + t('scene_' + k), k)));
  scS.onchange = () => { state.settings.scene = scS.value; markDirty(); updateWeather(); };
  Sky.init();
  const stg = $('#stage');
  stg.addEventListener('pointerdown', ev => {
    const tg = ev.target;
    if (tg !== stg && tg !== bookArea && !tg.classList.contains('topbar') && tg.id !== 'pager') return;
    unlockAudio();
    const r = stg.getBoundingClientRect(); Sky.poke(ev.clientX - r.left, ev.clientY - r.top);
  });
  // drawing
  const ICO = {
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14 7l3 3"/></svg>',
    marker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l-3 5h5l2-3"/><path d="M9 15l7-11 4 3-7 10z"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l5 5L9 20l-6 1 1-6z"/><path d="M14 5l5 5"/><path d="M4 15l5 5"/><path d="M3.5 20.5l2-.4-1.6-1.6z" fill="currentColor"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20h12"/><path d="M4.5 14.5L14 5l5 5-8.5 8.5a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8z"/><path d="M9 10l5 5"/></svg>'
  };
  const dt = $('#drawTools');
  Object.entries(DRAW_TOOLS).forEach(([k, v]) => {
    const b = document.createElement('button'); b.dataset.tool = k; b.title = v.label + (k === 'pen' ? ' (B)' : k === 'eraser' ? ' (E)' : '');
    b.innerHTML = ICO[k] + '<span>' + t('tool_' + k) + '</span>'; b.onclick = () => setDrawTool(k); dt.appendChild(b);
  });
  const sw = $('#drawSwatches');
  SWATCHES.forEach(c => { const b = document.createElement('button'); b.dataset.c = c; b.style.background = c; b.title = c; b.onclick = () => applyDraw({ color: c }); sw.appendChild(b); });
  const ci = document.createElement('input'); ci.type = 'color'; ci.id = 'drawColor'; ci.title = 'Custom color'; ci.addEventListener('input', () => applyDraw({ color: ci.value })); sw.appendChild(ci);
  $('#drawSize').addEventListener('input', ev => applyDraw({ size: +ev.target.value }));
  const bc = document.createElement('div'); bc.id = 'brushCursor'; bc.className = 'brushc'; pageEl.appendChild(bc);
  pageEl.addEventListener('pointermove', ev => { if (drawTool && !drag) moveBrushCursor(toPageClamped(ev)); });
  pageEl.addEventListener('pointerleave', () => { bc.style.width = bc.style.height = '0px'; });
}
function syncWeatherControls() {
  $('#citySel').value = state.settings.city in CITIES ? state.settings.city : 'hcm';
  const ss = $('#sceneSel'); if (ss) ss.value = SCENES[state.settings.scene] ? state.settings.scene : 'live';
}

/* ============ start ============ */
async function init() {
  bindUI(); fit();
  const s = localStorage.getItem(SESSION_KEY);
  user = s && getUsers()[s] ? s : null;
  await loadUser();
  setInterval(fetchWeather, 10 * 60 * 1000); setInterval(updateWeather, 30 * 1000);
  if (document.fonts) document.fonts.ready.then(() => { $$('#page .el-text').forEach(d => { const e = findEl(d.dataset.id); if (e) fitTextHeight(e, true); }); });
}
init();
})();
