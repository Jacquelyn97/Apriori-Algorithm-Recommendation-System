/**
 * 自助点餐数据：与 Expo 项目一致
 */
const categories = [
  { id: 'hot', name: '热销', sectionTitle: '热门推荐系列' },
  { id: 'signature', name: '招牌人气', sectionTitle: '招牌人气系列' },
  { id: 'fruit', name: '水果茶', sectionTitle: '水果茶系列' },
  { id: 'creative', name: '创新', sectionTitle: '创新系列' },
  { id: 'girl', name: '少女系', sectionTitle: '少女系颜值奶茶' },
  { id: 'summer', name: '夏日', sectionTitle: '夏日冰爽系列' },
  { id: 'healthy', name: '健康轻饮', sectionTitle: '健康轻饮系列' },
  { id: 'snack', name: '小吃及甜品', sectionTitle: '小吃/甜品系列' }
];

const items = [
  { id: 1, name: '黑糖珍珠奶茶', price: 10, categoryId: 'hot', image: 'rm01', description: '经典必点，浓郁黑糖+Q弹珍珠', taste: '浓郁黑糖香气，Q弹珍珠带来层次感', tagline: '一口下去，满满幸福感!' },
  { id: 2, name: '芝士奶盖抹茶', price: 14, categoryId: 'hot', image: 'rm02', description: '茶香搭配咸甜芝士奶盖', taste: '微苦茶香与浓厚奶盖的咸甜融合', tagline: '抹茶控的心头爱!' },
  { id: 3, name: '焦糖布丁奶茶', price: 13, categoryId: 'hot', image: 'rm03', description: '软嫩布丁 + 焦糖风味', taste: '香甜顺滑，焦糖布丁入口即化。', tagline: '一杯，甜进心里' },
  { id: 4, name: '金凤乌龙奶茶', price: 12, categoryId: 'signature', image: 'zp01', description: '茶香浓郁，经典回甘', taste: '茶香清爽回甘，奶味温润顺滑', tagline: '经典不败，老客最爱!' },
  { id: 5, name: '多多绿茶奶茶', price: 12, categoryId: 'signature', image: 'zp02', description: '养乐多清爽+奶香', taste: '酸甜养乐多与绿茶清香相遇', tagline: '每一口都清新解腻!' },
  { id: 6, name: '奥利奥脆脆奶茶', price: 14, categoryId: 'signature', image: 'zp03', description: '碎奥利奥 + 奶盖，口感层次丰富', taste: '香浓奶盖中夹杂酥脆奥利奥碎', tagline: '咬得到的满足!' },
  { id: 7, name: '杨枝甘露奶茶', price: 16, categoryId: 'fruit', image: 'sg01', description: '芒果+西柚+椰奶，清爽解腻', taste: '芒果与西柚的酸甜融合，清爽顺滑', tagline: '夏天的第一口甜蜜!' },
  { id: 8, name: '草莓芝士奶盖', price: 14, categoryId: 'fruit', image: 'sg02', description: '草莓果肉+浓郁奶盖', taste: '草莓果肉清新多汁，搭配厚厚芝士奶盖', tagline: '少女心爆棚!' },
  { id: 9, name: '百香果绿茶', price: 11, categoryId: 'fruit', image: 'sg03', description: '酸甜清爽，适合夏天', taste: '酸甜百香果搭配茶香回甘', tagline: '一口小清新!' },
  { id: 10, name: '芒果爆柠奶茶', price: 14, categoryId: 'fruit', image: 'sg04', description: '芒果丁+柠檬片+奶香', taste: '柠檬酸爽+芒果香甜，层次分明', tagline: '酸甜好滋味，停不下来!' },
  { id: 11, name: '奇异果百香奶茶', price: 12, categoryId: 'fruit', image: 'sg05', description: '酸甜搭配，层次丰富', taste: '奇异果清新，百香果粒带来爆汁感', tagline: '每一口都是惊喜!' },
  { id: 12, name: '橙香茉莉奶茶', price: 11, categoryId: 'fruit', image: 'sg06', description: '橙子片 + 茉莉花茶香', taste: '橙子清香+茉莉芬芳，茶香淡雅', tagline: '清新香气，沁人心脾!' },
  { id: 13, name: '火龙果椰香奶茶', price: 14, categoryId: 'fruit', image: 'sg07', description: '鲜艳色泽+清甜椰奶', taste: '绵密椰奶配鲜艳火龙果，浓郁顺滑', tagline: '高颜值，味道更惊艳!' },
  { id: 14, name: '柚子蜂蜜奶茶', price: 14, categoryId: 'fruit', image: 'sg08', description: '酸甜柚子+淡淡奶香', taste: '酸甜柚子与蜂蜜温润融合', tagline: '温暖你的每一口!' },
  { id: 15, name: '燕麦奶茶', price: 9, categoryId: 'creative', image: 'cx01', description: '低脂健康版', taste: '丝滑奶香中带有燕麦的清甜', tagline: '健康轻享新选择!' },
  { id: 16, name: '椰椰生椰拿铁', price: 11, categoryId: 'creative', image: 'cx02', description: '咖啡+生椰融合', taste: '咖啡醇香混合椰乳清新', tagline: '不一样的提神体验!' },
  { id: 17, name: '紫薯珍珠奶茶', price: 12, categoryId: 'creative', image: 'cx03', description: '香甜紫薯 + Q弹口感', taste: '紫薯绵密香甜，珍珠Q弹', tagline: '一杯暖心的紫色浪漫!' },
  { id: 18, name: '玫瑰荔枝奶茶', price: 16, categoryId: 'girl', image: 'sn01', description: '淡淡花香 + 荔枝果肉', taste: '花香淡雅，荔枝果肉清甜', tagline: '花香与果香的邂逅!' },
  { id: 19, name: '樱花草莓奶茶', price: 18, categoryId: 'girl', image: 'sn02', description: '粉嫩草莓 + 樱花气息', taste: '粉草莓与樱花风味，甜美梦幻', tagline: '拍照打卡必备!' },
  { id: 20, name: '蓝莓优格奶茶', price: 13, categoryId: 'girl', image: 'sn03', description: '酸甜蓝莓+浓稠酸奶', taste: '酸甜蓝莓搭配浓稠优格', tagline: '一口清爽一口幸福!' },
  { id: 21, name: '双拼渐变奶茶', price: 18, categoryId: 'girl', image: 'sn04', description: '蓝莓+草莓，两色渐变', taste: '草莓与蓝莓果汁融合，层次分明', tagline: '漂亮得舍不得喝!' },
  { id: 22, name: '樱花芝士奶盖茶', price: 21, categoryId: 'girl', image: 'sn05', description: '淡粉色+厚厚芝士顶', taste: '茶香清新，芝士浓郁。', tagline: '春天的味道在这杯!' },
  { id: 23, name: '梦幻彩虹奶茶', price: 25, categoryId: 'girl', image: 'sn06', description: '三层渐变色，适合拍照', taste: '多层果汁+奶香，层层惊喜', tagline: '打开彩虹的魔法!' },
  { id: 24, name: '薰衣草奶茶', price: 16, categoryId: 'girl', image: 'sn07', description: '淡紫色系+花香清新', taste: '淡紫色茶饮，花香舒缓', tagline: '让心情慢下来!' },
  { id: 25, name: '红丝绒可可奶茶', price: 18, categoryId: 'girl', image: 'sn08', description: '红丝绒蛋糕风味+奶香', taste: '丝滑可可搭配红丝绒风味', tagline: '高颜值+高幸福感!' },
  { id: 26, name: '椰果青柠奶茶', price: 15, categoryId: 'summer', image: 'xr01', description: '清爽解暑，口感有嚼劲', taste: '酸爽青柠+Q弹椰果', tagline: '夏日必备解暑神器!' },
  { id: 27, name: '西瓜冰奶茶', price: 14, categoryId: 'summer', image: 'xr02', description: '西瓜汁+奶香，夏日限定', taste: '西瓜清甜与奶茶融合', tagline: '一杯鲜甜夏日!' },
  { id: 28, name: '蜂蜜柠檬奶茶', price: 12, categoryId: 'summer', image: 'xr03', description: '清新解腻', taste: '柠檬酸爽，蜂蜜柔和', tagline: '温润解腻!' },
  { id: 29, name: '冰镇哈密瓜奶茶', price: 14, categoryId: 'summer', image: 'xr04', description: '清甜哈密瓜汁', taste: '香甜哈密瓜沁人心脾', tagline: '一杯下去，透心凉!' },
  { id: 30, name: '薄荷青柠奶茶', price: 12, categoryId: 'summer', image: 'xr05', description: '加入薄荷叶清凉解暑', taste: '薄荷清凉+青柠酸爽', tagline: '口感凉爽，一秒消暑!' },
  { id: 31, name: '蓝柑冰奶茶', price: 16, categoryId: 'summer', image: 'xr06', description: '淡蓝色系+海盐风味', taste: '淡蓝色海盐风味，清新独特', tagline: '夏天的海风味道!' },
  { id: 32, name: '冰冻葡萄奶茶', price: 12, categoryId: 'summer', image: 'xr07', description: '整颗葡萄 + 冰爽口感', taste: '葡萄爆汁，冰爽可口', tagline: '冰冰凉凉，喝了停不下!' },
  { id: 33, name: '菠萝椰香奶茶', price: 14, categoryId: 'summer', image: 'xr08', description: '热带风情，酸甜清爽', taste: '酸甜菠萝与椰香完美结合', tagline: '一口热带风情!' },
  { id: 34, name: '豆乳黑芝麻奶茶', price: 10, categoryId: 'healthy', image: 'jk01', description: '养生+饱腹感', taste: '浓郁豆香与芝麻融合', tagline: '营养与美味兼得!' },
  { id: 35, name: '低脂抹茶拿铁', price: 12, categoryId: 'healthy', image: 'jk02', description: '绿茶控必点', taste: '清新抹茶搭配低脂牛奶', tagline: '轻享不怕胖!' },
  { id: 36, name: '燕麦红枣奶茶', price: 8, categoryId: 'healthy', image: 'jk03', description: '养生风，暖胃', taste: '红枣香甜，燕麦顺滑', tagline: '养生一族首选!' },
  { id: 37, name: '豆乳燕麦奶茶', price: 6, categoryId: 'healthy', image: 'jk04', description: '高纤维，低负担', taste: '豆乳清香，燕麦丰富口感', tagline: '高纤维更健康!' },
  { id: 38, name: '黑豆芝麻豆浆奶茶', price: 12, categoryId: 'healthy', image: 'jk05', description: '轻养生', taste: '香浓黑豆搭配芝麻，滋补养生', tagline: '天然营养，喝出健康!' },
  { id: 39, name: '蜂蜜柠檬普洱奶茶', price: 9, categoryId: 'healthy', image: 'jk06', description: '解腻消食', taste: '普洱醇厚，柠檬酸爽，蜂蜜柔和', tagline: '解腻消食，喝着安心!' },
  { id: 40, name: '无糖生椰抹茶', price: 14, categoryId: 'healthy', image: 'jk07', description: '轻卡风味', taste: '抹茶清香与生椰清甜融合', tagline: '无负担的清新好味道!' },
  { id: 41, name: '炸鸡块', price: 13, categoryId: 'snack', image: 'xc01', taste: '外酥里嫩。外皮炸得嘎嘣脆，咬开后肉质紧实且带有充盈的油脂香气。', tagline: '金黄外衣下的肉汁炸弹，每一口都是对味蕾的最高礼赞。' },
  { id: 42, name: '鸡米花', price: 6, categoryId: 'snack', image: 'xc02', taste: '松脆鲜香。颗粒感十足，外层裹粉酥松，内里肉块弹牙，一口一个停不下来。', tagline: '指尖上的咔嚓脆，小身材大满足。' },
  { id: 43, name: '薯条', price: 5, categoryId: 'snack', image: 'xc03', taste: '外脆内糯。刚出锅时带着盐粒的微咸，芯里是土豆独有的绵密沙感。', tagline: '热气腾腾的灵魂伴侣，蘸出快乐的咸甜滋味。' },
  { id: 44, name: '小蛋糕', categoryId: 'snack', image: 'g01', price: 14, hasVariants: true, taste: '多层次交织。绵软的胚体搭配细腻奶油，果酱的酸甜在舌尖轻盈化开。', tagline: '缤纷果漾，是藏在奶油里的五彩幻梦。', variants: [{ id: 'cake_1', name: '樱花龙眼', price: 14, image: 'xc04' }, { id: 'cake_2', name: '抹茶红豆', price: 14, image: 'xc05' }, { id: 'cake_3', name: '蓝莓酸奶', price: 14, image: 'xc06' }, { id: 'cake_4', name: '芒果百香果', price: 14, image: 'xc07' }, { id: 'cake_5', name: '草莓巧克力', price: 14, image: 'xc08' }] },
  { id: 45, name: '曲奇', price: 8, categoryId: 'snack', image: 'xc09', taste: '酥酥入骨。浓郁奶香混合着巧克力的醇厚，入口即碎，余味悠长。', tagline: '一杯奶，一块饼，拼凑出慵懒的午后时光。' },
  { id: 46, name: '芝士蛋糕', price: 13, categoryId: 'snack', image: 'xc10', taste: '绵密醇厚。半熟芝士如云朵般轻盈，微咸与奶香完美平衡，入口即化。', tagline: '极致的丝滑，是给忙碌生活的一记温柔耳语。' },
  { id: 47, name: '麻薯球', price: 8, categoryId: 'snack', image: 'xc11', taste: 'Q弹软糯。外皮带一点点韧劲，内里湿润有弹性，椰蓉增加了丰富的颗粒感。', tagline: '糯叽叽的内心戏，裹着椰香的可爱暴击。' },
  { id: 48, name: '甜甜圈', categoryId: 'snack', image: 'g02', price: 9, hasVariants: true, taste: '扎实松软。面包体蓬松且有嚼劲，覆盖的糖霜与巧克力带来浓郁的甜蜜冲击。', tagline: '圆满的甜蜜，圈住生活里所有的美好。', variants: [{ id: 'donut_1', name: '椰子椰奶', price: 9, image: 'xc12' }, { id: 'donut_2', name: '草莓巧克力', price: 9, image: 'xc13' }, { id: 'donut_3', name: '草莓樱花', price: 9, image: 'xc14' }, { id: 'donut_4', name: '草莓椰奶', price: 9, image: 'xc15' }, { id: 'donut_5', name: '巧克力果仁', price: 9, image: 'xc16' }, { id: 'donut_6', name: '草莓椰子', price: 9, image: 'xc17' }] }
];

function getItemImagePath(key) {
  if (!key) return '';
  return `/assets/${key}.jpg`;
}

module.exports = { categories, items, getItemImagePath };
