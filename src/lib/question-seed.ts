/**
 * 六年级上册分数乘法应用题题库种子（共 50 道）。
 * 覆盖四种题型，难度分三档。
 * 导入时由 AI 生成标准答案与分步解析；fallbackAnswer / fallbackAnalysis
 * 仅当 AI 生成失败时兜底写入，保证题库完整性。
 */

export type SeedQuestionType =
  | "求一个数的几分之几"
  | "连续求"
  | "比一个数多或少几分之几"
  | "两问复合";

export interface SeedQuestion {
  stem: string;
  question_type: SeedQuestionType;
  difficulty: string;
  fallbackAnswer: string;
  fallbackAnalysis: string;
}

const ta = (stem: string, steps: string[]): string =>
  `【思路】${stem}\n1. ${steps[0]}\n2. ${steps[1]}\n最终结果保留最简分数形式。`;

export const QUESTION_SEED: SeedQuestion[] = [
  // ===== 求一个数的几分之几 =====
  { stem: "学校图书室有故事书240本，科技书的数量是故事书的 3/4，科技书有多少本？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "180", fallbackAnalysis: "求科技书数量，即求240的3/4是多少：240×(3/4)=180。" },
  { stem: "果园里有苹果树180棵，梨树是苹果树的 2/3，梨树有多少棵？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "120", fallbackAnalysis: "求梨树数量，即求180的2/3：180×(2/3)=120。" },
  { stem: "一袋大米重50千克，吃了它的 3/5，吃了多少千克？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "30", fallbackAnalysis: "求吃了多少，即求50的3/5：50×(3/5)=30千克。" },
  { stem: "修一条长1200米的路，已修了全长的 2/5，已修多少米？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "480", fallbackAnalysis: "求已修长度，即求1200的2/5：1200×(2/5)=480米。" },
  { stem: "某班有48名学生，其中 3/8 是女生，女生有多少人？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "18", fallbackAnalysis: "求女生人数，即求48的3/8：48×(3/8)=18人。" },
  { stem: "一箱苹果重25千克，卖掉了它的 2/5，卖掉多少千克？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "10", fallbackAnalysis: "求卖掉重量，即求25的2/5：25×(2/5)=10千克。" },
  { stem: "一段绳子长8米，用去了它的 3/4，用去多少米？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "6", fallbackAnalysis: "求用去长度，即求8的3/4：8×(3/4)=6米。" },
  { stem: "一个长方形操场长120米，宽是长的 2/3，宽是多少米？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "80", fallbackAnalysis: "求宽，即求120的2/3：120×(2/3)=80米。" },
  { stem: "农场养羊150只，其中 4/5 是绵羊，绵羊有多少只？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "120", fallbackAnalysis: "求绵羊只数，即求150的4/5：150×(4/5)=120只。" },
  { stem: "一本书有300页，第一天看了全书的 1/5，看了多少页？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "60", fallbackAnalysis: "求第一天看书页数，即求300的1/5：300×(1/5)=60页。" },

  // ===== 连续求 =====
  { stem: "商店运来梨120千克，苹果是梨的 3/4，香蕉是苹果的 2/3，香蕉有多少千克？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "60", fallbackAnalysis: "先求苹果：120×(3/4)=90千克；再求香蕉：90×(2/3)=60千克。" },
  { stem: "图书馆新进故事书200本，童话书是故事书的 3/5，连环画是童话书的 1/2，连环画有多少本？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "60", fallbackAnalysis: "先求童话书：200×(3/5)=120本；再求连环画：120×(1/2)=60本。" },
  { stem: "学校食堂运来大米400千克，第一周吃了 1/4，第二周吃的是第一周的 3/5，第二周吃了多少千克？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "60", fallbackAnalysis: "先求第一周：400×(1/4)=100千克；再求第二周：100×(3/5)=60千克。" },
  { stem: "果园有桃树160棵，梨树是桃树的 3/4，苹果树是梨树的 5/6，苹果树有多少棵？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "100", fallbackAnalysis: "先求梨树：160×(3/4)=120棵；再求苹果树：120×(5/6)=100棵。" },
  { stem: "甲收藏邮票90张，乙是甲的 2/3，丙是乙的 5/6，丙收藏多少张？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "50", fallbackAnalysis: "先求乙：90×(2/3)=60张；再求丙：60×(5/6)=50张。" },
  { stem: "修一条2400米的路，第一天修全长的 1/4，第二天修的是第一天的 3/5，第二天修了多少米？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "360", fallbackAnalysis: "先求第一天：2400×(1/4)=600米；再求第二天：600×(3/5)=360米。" },
  { stem: "舞蹈队有队员60人，其中 3/4 会跳民族舞，民族舞队员中 2/5 会跳街舞，会跳街舞的有多少人？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "18", fallbackAnalysis: "先求民族舞队员：60×(3/4)=45人；再求街舞队员：45×(2/5)=18人。" },
  { stem: "农场养鸡300只，鸭是鸡的 3/5，鹅是鸭的 3/4，鹅有多少只？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "135", fallbackAnalysis: "先求鸭：300×(3/5)=180只；再求鹅：180×(3/4)=135只。" },
  { stem: "一批货物480吨，第一次运走 1/3，第二次运走的是第一次的 3/4，第二次运走了多少吨？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "120", fallbackAnalysis: "先求第一次：480×(1/3)=160吨；再求第二次：160×(3/4)=120吨。" },
  { stem: "一袋糖果360克，小红吃了 1/3，小刚吃的是小红的 2/3，小刚吃了多少克？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "80", fallbackAnalysis: "先求小红：360×(1/3)=120克；再求小刚：120×(2/3)=80克。" },

  // ===== 比一个数多或少几分之几 =====
  { stem: "男生有40人，女生比男生多 1/4，女生有多少人？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "50", fallbackAnalysis: "女生比男生多1/4，即女生的数量是男生的(1+1/4)=5/4：40×(5/4)=50人。" },
  { stem: "一本书原价60元，涨价 1/5 后现价是多少元？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "72", fallbackAnalysis: "现价是原价的(1+1/5)=6/5：60×(6/5)=72元。" },
  { stem: "一桶水重90千克，用去它的 1/3 后还剩多少千克？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "60", fallbackAnalysis: "还剩原来的(1-1/3)=2/3：90×(2/3)=60千克。" },
  { stem: "果园梨树120棵，桃树比梨树少 1/6，桃树有多少棵？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "100", fallbackAnalysis: "桃树是梨树的(1-1/6)=5/6：120×(5/6)=100棵。" },
  { stem: "去年生产收音机500台，今年比去年增产 1/4，今年生产多少台？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "625", fallbackAnalysis: "今年是去年的(1+1/4)=5/4：500×(5/4)=625台。" },
  { stem: "一件商品原价450元，降价 1/5，现价是多少元？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "360", fallbackAnalysis: "现价是原价的(1-1/5)=4/5：450×(4/5)=360元。" },
  { stem: "学校原有图书2000册，又购进了 1/10，现在共有图书多少册？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "2200", fallbackAnalysis: "现在是原来的(1+1/10)=11/10：2000×(11/10)=2200册。" },
  { stem: "甲数是120，乙数比甲数少 3/5，乙数是多少？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "48", fallbackAnalysis: "乙数是甲数的(1-3/5)=2/5：120×(2/5)=48。" },
  { stem: "小明有零花钱80元，花掉它的 1/4 后还剩多少元？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "60", fallbackAnalysis: "还剩原来的(1-1/4)=3/4：80×(3/4)=60元。" },
  { stem: "一款电视原价3000元，现在降价 1/6 出售，现价是多少元？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "2500", fallbackAnalysis: "现价是原价的(1-1/6)=5/6：3000×(5/6)=2500元。" },
  { stem: "一箱饮料120瓶，卖出 1/3，还剩多少瓶？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "80", fallbackAnalysis: "还剩原来的(1-1/3)=2/3：120×(2/3)=80瓶。" },
  { stem: "公园里杨树160棵，柳树比杨树多 1/8，柳树有多少棵？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "180", fallbackAnalysis: "柳树是杨树的(1+1/8)=9/8：160×(9/8)=180棵。" },

  // ===== 两问复合 =====
  { stem: "一本书有240页，第一天看全书的 1/6，第二天看全书的 1/4。（1）第一天看了多少页？（2）两天共看多少页？", question_type: "两问复合", difficulty: "简单", fallbackAnswer: "40、100", fallbackAnalysis: "(1)第一天：240×(1/6)=40页；(2)两天共看：40+240×(1/4)=40+60=100页。" },
  { stem: "学校运来煤250吨，用去了 3/5。（1）用去多少吨？（2）还剩多少吨？", question_type: "两问复合", difficulty: "简单", fallbackAnswer: "150、100", fallbackAnalysis: "(1)用去：250×(3/5)=150吨；(2)还剩：250-150=100吨。" },
  { stem: "果园有苹果树300棵，梨树是苹果树的 2/3，桃树是梨树的 1/2。（1）梨树多少棵？（2）桃树多少棵？", question_type: "两问复合", difficulty: "简单", fallbackAnswer: "200、100", fallbackAnalysis: "(1)梨树：300×(2/3)=200棵；(2)桃树：200×(1/2)=100棵。" },
  { stem: "一根绳子长240米，第一次用去 1/4，第二次用去 1/6。（1）第一次用去多少米？（2）两次共用去多少米？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "60、100", fallbackAnalysis: "(1)第一次：240×(1/4)=60米；(2)两次共用：60+240×(1/6)=60+40=100米。" },
  { stem: "一堆煤480吨，第一天运走 1/3，第二天运走 1/4。（1）第一天运走多少吨？（2）两天共运走多少吨？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "160、280", fallbackAnalysis: "(1)第一天：480×(1/3)=160吨；(2)两天共运：160+480×(1/4)=160+120=280吨。" },
  { stem: "每包糖果120颗，分给甲班 3/5，乙班分得甲班的 3/4。（1）甲班分得多少颗？（2）乙班分得多少颗？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "72、54", fallbackAnalysis: "(1)甲班：120×(3/5)=72颗；(2)乙班：72×(3/4)=54颗。" },
  { stem: "修路队要修600米，第一天修 1/6，第二天修的是第一天的 1/2。（1）第一天修多少米？（2）第二天修多少米？", question_type: "两问复合", difficulty: "简单", fallbackAnswer: "100、50", fallbackAnalysis: "(1)第一天：600×(1/6)=100米；(2)第二天：100×(1/2)=50米。" },
  { stem: "饲养场养鸡240只，鹅是鸡的 3/8，鸭是鹅的 2/3。（1）鹅多少只？（2）鸭多少只？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "90、60", fallbackAnalysis: "(1)鹅：240×(3/8)=90只；(2)鸭：90×(2/3)=60只。" },
  { stem: "学校买来144个球，其中 1/4 是篮球，足球是篮球的 2/3。（1）篮球多少个？（2）足球多少个？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "36、24", fallbackAnalysis: "(1)篮球：144×(1/4)=36个；(2)足球：36×(2/3)=24个。" },
  { stem: "一根钢管长180米，第一次用去 1/5，第二次用去 1/6。（1）第二次用去多少米？（2）两次共用去多少米？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "30、66", fallbackAnalysis: "(1)第二次：180×(1/6)=30米；(2)两次共用：180×(1/5)+30=36+30=66米。" },
  { stem: "一条路全长360米，第一天修全长的 1/4，第二天修的是第一天的 5/6。（1）第一天修多少米？（2）第二天修多少米？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "90、75", fallbackAnalysis: "(1)第一天：360×(1/4)=90米；(2)第二天：90×(5/6)=75米。" },
  { stem: "果园有果树480棵，桃树占 1/4，梨树占 1/6。（1）桃树多少棵？（2）桃树比梨树多多少棵？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "120、40", fallbackAnalysis: "(1)桃树：480×(1/4)=120棵；(2)梨树：480×(1/6)=80棵，桃树比梨树多120-80=40棵。" },

  // ===== 补充较难题 =====
  { stem: "一件毛衣原价240元，先提价 1/4，再按提价后的 4/5 出售。（1）提价后多少元？（2）现价多少元？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "300、240", fallbackAnalysis: "(1)提价后：240×(1+1/4)=300元；(2)现价：300×(4/5)=240元。" },
  { stem: "一桶油重200千克，第一次用去 1/4，第二次用去余下的 1/2。（1）第一次用去多少千克？（2）第二次用去多少千克？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "50、75", fallbackAnalysis: "(1)第一次：200×(1/4)=50千克；(2)余下200-50=150千克，第二次：150×(1/2)=75千克。" },
  { stem: "仓库有货物640吨，第一天运走总数的 1/4，第二天运走的比第一天多 1/5，第二天运走多少吨？", question_type: "比一个数多或少几分之几", difficulty: "较难", fallbackAnswer: "192", fallbackAnalysis: "第一天：640×(1/4)=160吨；第二天比第一天多1/5，即160×(1+1/5)=160×(6/5)=192吨。" },
  { stem: "甲、乙、丙三个数，甲数是240，乙数是甲数的 5/8，丙数比乙数少 1/3，丙数是多少？", question_type: "连续求", difficulty: "较难", fallbackAnswer: "100", fallbackAnalysis: "乙：240×(5/8)=150；丙比乙少1/3，即丙=150×(1-1/3)=150×(2/3)=100。" },
  { stem: "一辆汽车油箱有汽油60升，第一次用去 1/5，第二次用去余下的 1/4，两次共用去多少升？", question_type: "连续求", difficulty: "较难", fallbackAnswer: "24", fallbackAnalysis: "第一次：60×(1/5)=12升；余下60-12=48升；第二次：48×(1/4)=12升；两次共用12+12=24升。" },
  { stem: "一本书共360页，第一天看全书的 1/6，第二天看的是第一天的 3/5。（1）第一天看了多少页？（2）第二天看了多少页？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "60、36", fallbackAnalysis: "(1)第一天：360×(1/6)=60页；(2)第二天：60×(3/5)=36页。" },
];