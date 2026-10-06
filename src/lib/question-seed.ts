/**
 * 六年级上册分数乘法应用题题库种子（共 50 道）。
 * 题目来源：六年级上册分数乘法应用题(1).docx
 * 覆盖四种题型，难度分三档。
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

export const QUESTION_SEED: SeedQuestion[] = [
  // ===== 求一个数的几分之几 =====
  { stem: "六(1)班有学生45人，其中男生占全班人数的4/9，男生有多少人？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "20", fallbackAnalysis: "求男生人数，即求45的4/9：45×(4/9)=20人。" },
  { stem: "一本书共240页，小华第一天看了全书的1/6，第一天看了多少页？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "40", fallbackAnalysis: "求第一天看的页数，即求240的1/6：240×(1/6)=40页。" },
  { stem: "商店运来800千克苹果，卖出了3/8，卖出多少千克？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "300", fallbackAnalysis: "求卖出重量，即求800的3/8：800×(3/8)=300千克。" },
  { stem: "妈妈买来12千克大米，吃了1/4，吃了多少千克？还剩多少千克？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "3、9", fallbackAnalysis: "吃了：12×(1/4)=3千克；还剩：12-3=9千克。" },
  { stem: "学校图书馆有故事书360本，科技书的本数是故事书的5/6，科技书有多少本？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "300", fallbackAnalysis: "求科技书本数，即求360的5/6：360×(5/6)=300本。" },
  { stem: "一块地有5/6公顷，其中2/5种了西红柿，种西红柿的地有多少公顷？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "1/3", fallbackAnalysis: "求种西红柿的面积，即求5/6的2/5：(5/6)×(2/5)=1/3公顷。" },
  { stem: "修一条长4/5千米的公路，已经修了全长的3/4，已经修了多少千米？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "3/5", fallbackAnalysis: "求已修长度，即求4/5的3/4：(4/5)×(3/4)=3/5千米。" },
  { stem: "某工厂九月份用水480吨，十月份的用水量是九月份的5/8，十月份用水多少吨？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "300", fallbackAnalysis: "求十月份用水量，即求480的5/8：480×(5/8)=300吨。" },
  { stem: "一辆汽车每小时行驶72千米，1/2小时行驶多少千米？3/4小时呢？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "36、54", fallbackAnalysis: "1/2小时：72×(1/2)=36千米；3/4小时：72×(3/4)=54千米。" },
  { stem: "六年级有学生150人，其中3/5参加了书法兴趣小组，参加书法兴趣小组的有多少人？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "90", fallbackAnalysis: "求参加人数，即求150的3/5：150×(3/5)=90人。" },
  { stem: "水果店有梨600千克，苹果的质量是梨的7/10，苹果有多少千克？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "420", fallbackAnalysis: "求苹果质量，即求600的7/10：600×(7/10)=420千克。" },
  { stem: "一袋面粉重25千克，用去了2/5，用去多少千克？还剩多少千克？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "10、15", fallbackAnalysis: "用去：25×(2/5)=10千克；还剩：25-10=15千克。" },
  { stem: "某小学有学生840人，四年级学生占全校人数的2/7，四年级有学生多少人？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "240", fallbackAnalysis: "求四年级人数，即求840的2/7：840×(2/7)=240人。" },
  { stem: "一根钢管长9/10米，用去了全长的1/3，用去了多少米？", question_type: "求一个数的几分之几", difficulty: "中等", fallbackAnswer: "3/10", fallbackAnalysis: "求用去长度，即求9/10的1/3：(9/10)×(1/3)=3/10米。" },
  { stem: "一件衣服原价320元，打折后是原价的3/4，打折后多少元？", question_type: "求一个数的几分之几", difficulty: "简单", fallbackAnswer: "240", fallbackAnalysis: "求打折后价格，即求320的3/4：320×(3/4)=240元。" },

  // ===== 连续求 =====
  { stem: "果园里有桃树480棵，梨树的棵数是桃树的5/8，苹果树的棵数是梨树的3/4，苹果树有多少棵？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "225", fallbackAnalysis: "先求梨树：480×(5/8)=300棵；再求苹果树：300×(3/4)=225棵。" },
  { stem: "学校图书馆有故事书360本，科技书的本数是故事书的5/6，连环画的本数是科技书的2/3，连环画有多少本？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "200", fallbackAnalysis: "先求科技书：360×(5/6)=300本；再求连环画：300×(2/3)=200本。" },
  { stem: "六年级同学收集废纸45千克，五年级收集的是六年级的2/3，四年级收集的是五年级的1/2，四年级收集废纸多少千克？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "15", fallbackAnalysis: "先求五年级：45×(2/3)=30千克；再求四年级：30×(1/2)=15千克。" },
  { stem: "一桶油重20千克，第一次用去全桶的1/5，第二次用去的是第一次的3/4，第二次用去多少千克？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "3", fallbackAnalysis: "先求第一次：20×(1/5)=4千克；再求第二次：4×(3/4)=3千克。" },
  { stem: "某工厂计划生产零件6000个，第一周完成计划的1/4，第二周完成的是第一周的6/5，第二周完成多少个？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "1800", fallbackAnalysis: "先求第一周：6000×(1/4)=1500个；再求第二周：1500×(6/5)=1800个。" },
  { stem: "妈妈买回一箱牛奶共24盒，爸爸喝了总数的1/6，小红喝的是爸爸的3/4，小红喝了多少盒？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "3", fallbackAnalysis: "先求爸爸：24×(1/6)=4盒；再求小红：4×(3/4)=3盒。" },
  { stem: "六(1)班有图书120本，借出总数的1/3，借出的书中故事书占1/2，借出的故事书有多少本？", question_type: "连续求", difficulty: "简单", fallbackAnswer: "20", fallbackAnalysis: "先求借出：120×(1/3)=40本；再求故事书：40×(1/2)=20本。" },
  { stem: "一块菜地面积是120平方米，其中2/5种萝卜，种白菜的面积是种萝卜面积的3/4，种白菜多少平方米？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "36", fallbackAnalysis: "先求萝卜：120×(2/5)=48平方米；再求白菜：48×(3/4)=36平方米。" },
  { stem: "商店运来一批水果共900千克，其中苹果占2/5，梨的质量是苹果的5/6，梨有多少千克？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "300", fallbackAnalysis: "先求苹果：900×(2/5)=360千克；再求梨：360×(5/6)=300千克。" },
  { stem: "甲象体重4吨，乙象体重是甲象的4/5，丙象体重是乙象的7/8，丙象体重多少吨？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "14/5", fallbackAnalysis: "先求乙象：4×(4/5)=16/5吨；再求丙象：(16/5)×(7/8)=14/5吨。" },
  { stem: "修一条长5/6千米的路，第一天修了全长的1/2，第二天修的是第一天的2/3，第二天修了多少千米？", question_type: "连续求", difficulty: "较难", fallbackAnswer: "5/18", fallbackAnalysis: "先求第一天：(5/6)×(1/2)=5/12千米；再求第二天：(5/12)×(2/3)=5/18千米。" },
  { stem: "小明有零花钱72元，他捐出总数的1/2，其中1/4捐给了灾区小朋友，捐给灾区小朋友多少元？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "9", fallbackAnalysis: "先求捐出总数：72×(1/2)=36元；再求捐给灾区：36×(1/4)=9元。" },
  { stem: "养鸡场有母鸡1200只，公鸡的只数是母鸡的1/4，小鸡的只数是公鸡的2/3，小鸡有多少只？", question_type: "连续求", difficulty: "中等", fallbackAnswer: "200", fallbackAnalysis: "先求公鸡：1200×(1/4)=300只；再求小鸡：300×(2/3)=200只。" },

  // ===== 比一个数多或少几分之几 =====
  { stem: "学校图书馆有故事书360本，科技书比故事书多1/4，科技书有多少本？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "450", fallbackAnalysis: "科技书是故事书的(1+1/4)=5/4：360×(5/4)=450本。" },
  { stem: "商店运来800千克苹果，梨比苹果少3/8，梨有多少千克？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "500", fallbackAnalysis: "梨是苹果的(1-3/8)=5/8：800×(5/8)=500千克。" },
  { stem: "某工厂九月份用水480吨，十月份比九月份节约1/8，十月份用水多少吨？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "420", fallbackAnalysis: "十月份是九月份的(1-1/8)=7/8：480×(7/8)=420吨。" },
  { stem: "六年级有学生150人，五年级人数比六年级少1/5，五年级有学生多少人？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "120", fallbackAnalysis: "五年级是六年级的(1-1/5)=4/5：150×(4/5)=120人。" },
  { stem: "一件衣服原价320元，现在降价1/8出售，现价多少元？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "280", fallbackAnalysis: "现价是原价的(1-1/8)=7/8：320×(7/8)=280元。" },
  { stem: "某小学现在有学生840人，去年学生人数比现在少1/7，去年有学生多少人？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "720", fallbackAnalysis: "去年是现在的(1-1/7)=6/7：840×(6/7)=720人。" },
  { stem: "汽车每小时行驶60千米，火车的速度比汽车快2/3，火车每小时行驶多少千米？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "100", fallbackAnalysis: "火车速度是汽车的(1+2/3)=5/3：60×(5/3)=100千米。" },
  { stem: "水果店有梨600千克，苹果比梨多1/6，苹果有多少千克？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "700", fallbackAnalysis: "苹果是梨的(1+1/6)=7/6：600×(7/6)=700千克。" },
  { stem: "小明身高140厘米，小华比小明高1/14，小华身高多少厘米？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "150", fallbackAnalysis: "小华身高是小明的(1+1/14)=15/14：140×(15/14)=150厘米。" },
  { stem: "电视机厂十月份生产电视机3600台，十一月份比十月份增产1/12，十一月份生产多少台？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "3900", fallbackAnalysis: "十一月份是十月份的(1+1/12)=13/12：3600×(13/12)=3900台。" },
  { stem: "一块地有5/6公顷，其中2/5种了西红柿，种黄瓜的面积比种西红柿的多1/2，种黄瓜多少公顷？", question_type: "比一个数多或少几分之几", difficulty: "较难", fallbackAnswer: "1/2", fallbackAnalysis: "先求西红柿：(5/6)×(2/5)=1/3公顷；黄瓜比西红柿多1/2，即(1/3)×(1+1/2)=(1/3)×(3/2)=1/2公顷。" },
  { stem: "一辆汽车每小时行驶72千米，一列火车的速度比汽车快3/4，火车每小时行驶多少千米？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "126", fallbackAnalysis: "火车速度是汽车的(1+3/4)=7/4：72×(7/4)=126千米。" },
  { stem: "果园去年收入12万元，今年比去年增加1/6，今年收入多少万元？", question_type: "比一个数多或少几分之几", difficulty: "简单", fallbackAnswer: "14", fallbackAnalysis: "今年是去年的(1+1/6)=7/6：12×(7/6)=14万元。" },
  { stem: "食堂九月份用水180吨，十月份比九月份节约1/10，十月份用水多少吨？两个月共用水多少吨？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "162、342", fallbackAnalysis: "十月份是九月份的(1-1/10)=9/10：180×(9/10)=162吨；两个月共用水：180+162=342吨。" },
  { stem: "一本故事书有180页，小明第一天看了全书的1/6，第二天看的页数比第一天多1/3，第二天看了多少页？", question_type: "比一个数多或少几分之几", difficulty: "中等", fallbackAnswer: "40", fallbackAnalysis: "第一天：180×(1/6)=30页；第二天比第一天多1/3，即30×(1+1/3)=30×(4/3)=40页。" },

  // ===== 两问复合 =====
  { stem: "果园里有桃树480棵，梨树比桃树多1/4，苹果树是梨树的2/3，苹果树有多少棵？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "400", fallbackAnalysis: "梨树比桃树多1/4：480×(1+1/4)=600棵；苹果树是梨树的2/3：600×(2/3)=400棵。" },
  { stem: "商店运来苹果360千克，梨比苹果多1/9，运来的橘子是梨的1/2，橘子有多少千克？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "200", fallbackAnalysis: "梨比苹果多1/9：360×(1+1/9)=400千克；橘子是梨的1/2：400×(1/2)=200千克。" },
  { stem: "建筑工地有水泥240吨，第一天用去总数的1/6，第二天比第一天多用1/4，第二天用去多少吨？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "50", fallbackAnalysis: "第一天：240×(1/6)=40吨；第二天比第一天多1/4：40×(1+1/4)=50吨。" },
  { stem: "一本书240页，小明第一天看了全书的1/6，第二天看的比第一天多1/2，还剩多少页没看？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "140", fallbackAnalysis: "第一天：240×(1/6)=40页；第二天比第一天多1/2：40×(1+1/2)=60页；还剩：240-40-60=140页。" },
  { stem: "六(2)班男生有24人，女生比男生多1/6，全班有多少人？", question_type: "两问复合", difficulty: "中等", fallbackAnswer: "52", fallbackAnalysis: "女生比男生多1/6：24×(1+1/6)=28人；全班：24+28=52人。" },
  { stem: "一批货物120吨，第一次运走1/4，第二次运走的比第一次多1/3，还剩多少吨没有运？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "50", fallbackAnalysis: "第一次：120×(1/4)=30吨；第二次比第一次多1/3：30×(1+1/3)=40吨；还剩：120-30-40=50吨。" },
  { stem: "某校四年级有学生320人，五年级人数是四年级的7/8，六年级比五年级多1/14，六年级有多少人？", question_type: "两问复合", difficulty: "较难", fallbackAnswer: "300", fallbackAnalysis: "五年级：320×(7/8)=280人；六年级比五年级多1/14：280×(1+1/14)=280×(15/14)=300人。" },
];
