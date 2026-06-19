const { getDb } = require('../lib/db');
const { hashPassword } = require('../lib/auth');

const db = getDb();
console.log('🌱 Seeding Legacy Box demo data (rich edition)...\n');

// Clear data in correct order (children → parents).
// Disable FK enforcement during the wipe so reference columns (e.g. users.person_id) don't block deletes.
db.pragma('foreign_keys = OFF');
db.prepare('DELETE FROM timeline_events').run();
db.prepare('DELETE FROM archive_items').run();
db.prepare('DELETE FROM oral_histories').run();
try { db.prepare('DELETE FROM personal_entries').run(); } catch (e) {}
db.prepare('DELETE FROM people').run();
db.prepare('DELETE FROM users').run();
db.pragma('foreign_keys = ON');
// Reset autoincrement so person ids start at 1
db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('people','timeline_events','archive_items','oral_histories','users')").run();

// USERS
const u = db.prepare('INSERT INTO users (username, password_hash, display_name, display_name_en, role) VALUES (?, ?, ?, ?, ?)');
u.run('admin', hashPassword('admin123'), '陈墨白 · 档案管理员', 'Chen Mobai · Archivist', 'admin');
u.run('family', hashPassword('family123'), '陈知远 · 家族成员', 'Chen Zhiyuan · Family Member', 'member');
u.run('guest', hashPassword('guest123'), 'Guest 访客', 'Guest', 'guest');
console.log('  ✓ 3 demo accounts');

// PEOPLE
const p = db.prepare(`INSERT INTO people (name, name_en, birth_year, death_year, role_in_family, role_in_family_en, bio_public, bio_public_en, bio_private, bio_private_en, photo_url, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

p.run('陈承宗', 'Chen Chengzong', 1898, 1976, '第一代 · 家族奠基人 · 曾祖父', 'First Generation · Family Founder · Great-Grandfather',
'陈承宗，字守拙，1898 年生于江苏吴县书香门第。其父陈兆元为清末举人，曾任江南制造局文案。承宗少年聪颖，十六岁考入江苏省立第一中学，1919 年东渡日本，入早稻田大学经济学部，期间结识同乡梁漱溟、李叔同等。1925 年学成归国，先后在上海商务印书馆、南京中央大学任职。1929 年，与同乡合资创办「吴县承裕纺织厂」，并在故乡兴办「承裕小学」，倡导「实业济世，教育树人」。抗战期间举家西迁昆明，将纺织厂技术骨干带至大后方继续生产。1949 年后留任公私合营企业顾问。1976 年病逝于上海，享年七十八岁。',
'Chen Chengzong, courtesy name Shouzhuo, was born in 1898 into a scholarly family in Wu County, Jiangsu. His father, Chen Zhaoyuan, was a successful provincial examination candidate (juren) of the late Qing dynasty who had served as a clerk at the Jiangnan Arsenal. Bright from an early age, Chengzong was admitted to Jiangsu Provincial No. 1 Middle School at sixteen. In 1919 he sailed east to Japan and enrolled in the Faculty of Economics at Waseda University, where he became acquainted with fellow countrymen such as Liang Shuming and Li Shutong. He completed his studies and returned to China in 1925, holding posts successively at the Commercial Press in Shanghai and at National Central University in Nanjing. In 1929, together with fellow townsmen, he co-founded the Wu County Chengyu Textile Mill and established the Chengyu Primary School in his hometown, advocating the ideals of "serving society through industry, and cultivating people through education." During the War of Resistance against Japan, he moved his entire family west to Kunming, bringing the mill\'s technical backbone to the rear to continue production. After 1949 he stayed on as an adviser to a public-private joint enterprise. He died of illness in Shanghai in 1976 at the age of seventy-eight.',
'【家族成员视角】曾祖父晚年（1968-1975）因时局动荡，将大部分藏书与文房用具藏于江苏老宅宗祠的地窖中，1980 年代由二房后人取出。其中包括早年东京求学时的日记五册、与梁漱溟往来书信三十七封，以及一份未公开的「承裕纺织厂股权分配草案」原稿。1976 年逝世前三天，他在病榻上手书《守拙堂遗训》一卷，由长子守仁亲自誊抄三份，分别交予三房后人保管。原稿现存于家族档案馆 A-1 保险柜，恒温恒湿保管。曾祖父晚年坚持写日记的习惯保留至 1975 年底，最后一篇日记仅一句：「人去物存，物在人未必在。」',
'[Family Members\' Perspective] In his later years (1968-1975), amid the turmoil of the times, Great-Grandfather hid most of his book collection and writing implements in the cellar of the ancestral hall at the old family home in Jiangsu; they were retrieved in the 1980s by descendants of the second branch. Among them were five volumes of diaries from his student days in Tokyo, thirty-seven letters exchanged with Liang Shuming, and an unpublished original draft of the "Chengyu Textile Mill Equity Distribution Plan." Three days before his death in 1976, he wrote out by hand from his sickbed a scroll titled "Testament of the Shouzhuo Hall," which his eldest son Shouren personally transcribed into three copies, each entrusted to the descendants of one of the three branches. The original is now kept in safe-deposit box A-1 of the Family Archive under temperature- and humidity-controlled conditions. Great-Grandfather kept up his habit of writing a diary until the end of 1975; his final entry consisted of a single line: "When a person is gone, their things remain; but while the things remain, the person may not."',
null, 'public');

p.run('林佩兰', 'Lin Peilan', 1903, 1989, '第一代 · 曾祖母', 'First Generation · Great-Grandmother',
'林佩兰，1903 年生于福州书香世家。其父林孝鸿为清末举人，曾任福州格致书院教习。佩兰女士早年就读于福州女子师范学校，1924 年与陈承宗在上海订婚，1925 年成婚。婚后随承宗辗转上海、南京、昆明三地，育有四子二女。1937 年抗战爆发，独自带领老人与年幼子女从上海经香港转往昆明与丈夫会合，途中失散一女（次女陈宛芳，时年五岁，至今下落不明）。佩兰女士擅长古典诗词与女红，晚年居上海，1989 年安详离世，享年八十六岁。',
'Lin Peilan was born in 1903 into a scholarly family in Fuzhou. Her father, Lin Xiaohong, was a successful provincial examination candidate (juren) of the late Qing dynasty who had served as an instructor at the Gezhi Academy in Fuzhou. In her youth Ms. Lin studied at the Fuzhou Women\'s Normal School. She became engaged to Chen Chengzong in Shanghai in 1924 and married him in 1925. After their marriage she followed Chengzong as he moved among Shanghai, Nanjing, and Kunming, and bore four sons and two daughters. When the War of Resistance broke out in 1937, she alone led the elderly and the young children from Shanghai via Hong Kong to Kunming to reunite with her husband; along the way she lost one daughter (her second daughter, Chen Wanfang, then five years old, whose whereabouts remain unknown to this day). Ms. Lin was skilled in classical poetry and needlework. She spent her later years in Shanghai and passed away peacefully in 1989 at the age of eighty-six.',
'【家族成员视角】曾祖母 1937 年逃难日记现存六册，详细记载了沿途见闻与次女走失经过。1985 年她曾通过香港红十字会发起寻人，未果。家族每年清明仍在祠堂为陈宛芳立位。',
'[Family Members\' Perspective] Six volumes of Great-Grandmother\'s 1937 wartime flight diaries survive, recording in detail what she witnessed along the way and the circumstances of her second daughter\'s disappearance. In 1985 she launched a search through the Hong Kong Red Cross, but to no avail. Each year at the Qingming Festival the family still sets up a memorial tablet for Chen Wanfang in the ancestral hall.',
null, 'member');

p.run('陈守仁', 'Chen Shouren', 1925, 2008, '第二代 · 长子 · 祖父', 'Second Generation · Eldest Son · Grandfather',
'陈守仁，1925 年 8 月生于上海法租界。1937 年随母西迁，少年时在昆明完成中学学业。1946 年考入西南联合大学物理学系，师从吴大猷、王竹溪等先生，1950 年毕业于清华大学（联大复员后转入）。1952 年起在某高校物理系任教，参与了国内早期半导体材料的基础研究。1957 年至 1965 年间，被借调至某科研单位参与重大项目（具体内容至 2015 年才部分解密）。1978 年恢复学术工作后，培养硕士、博士研究生四十余名。著有《半导体物理基础》（1985）、《物理学者的笔记》（1998）。2008 年因肺癌病逝于北京，享年八十三岁。',
'Chen Shouren was born in August 1925 in the French Concession of Shanghai. In 1937 he moved west with his mother and completed his secondary education in Kunming as a youth. In 1946 he was admitted to the Department of Physics at the National Southwest Associated University (Lianda), studying under masters such as Wu Ta-You and Wang Zhuxi, and graduated in 1950 from Tsinghua University (to which he transferred after Lianda was demobilized). From 1952 he taught in the physics department of a certain university and took part in China\'s early fundamental research on semiconductor materials. Between 1957 and 1965 he was seconded to a research institution to work on a major project (the specifics of which were only partially declassified in 2015). After resuming academic work in 1978, he trained more than forty master\'s and doctoral students. He authored "Fundamentals of Semiconductor Physics" (1985) and "Notes of a Physicist" (1998). He died of lung cancer in Beijing in 2008 at the age of eighty-three.',
'【家族成员视角】祖父 1957 至 1965 年的工作日志共九册，涉及当时尚未公开的科研合作历史，部分内容至今仍受保密期约束。原件由二叔陈昭明（北京家族办公室）保管。1998 年回忆录初稿《物理学者的笔记》原本写至 1976 年，但 1999 年出版时删去了 1957-1965 这一段，删稿现存于档案馆 B-3 柜。',
'[Family Members\' Perspective] Grandfather\'s work journals from 1957 to 1965 comprise nine volumes, touching on a history of scientific collaboration that was not publicly known at the time; some of the contents remain under confidentiality restrictions to this day. The originals are kept by Second Uncle Chen Zhaoming (Beijing Family Office). The 1998 first draft of his memoir "Notes of a Physicist" originally ran up to 1976, but the 1957-1965 section was cut when it was published in 1999; the deleted manuscript is now kept in cabinet B-3 of the Archive.',
null, 'public');

p.run('陈守德', 'Chen Shoude', 1928, 1995, '第二代 · 次子 · 二叔公', 'Second Generation · Second Son · Great-Granduncle',
'陈守德，1928 年生于上海。早年随兄长在昆明读书，1948 年考入中央大学医学院，1953 年毕业后赴东北从事公共卫生工作。1960 年代初参与边疆地区医疗援助。1995 年于哈尔滨病逝，享年六十七岁。终身未婚，无后嗣。',
'Chen Shoude was born in Shanghai in 1928. In his early years he studied in Kunming alongside his elder brother. In 1948 he was admitted to the Medical School of National Central University, and after graduating in 1953 he went to the Northeast to work in public health. In the early 1960s he took part in medical aid to frontier regions. He died of illness in Harbin in 1995 at the age of sixty-seven. He never married and left no descendants.',
'【家族成员视角】二叔公的医疗援助经历曾涉及一段未公开的边境工作，相关日记由家族档案馆收存，仅供家族研究使用。',
'[Family Members\' Perspective] Great-Granduncle\'s medical-aid experience involved a period of undisclosed border work; the related diaries are held in the Family Archive and are reserved for family research use only.',
null, 'public');

p.run('陈昭华', 'Chen Zhaohua', 1955, null, '第三代 · 长孙 · 父亲', 'Third Generation · Eldest Grandson · Father',
'陈昭华，1955 年 11 月生于北京。少年在动荡年代成长，1977 年恢复高考后第一批考入清华大学电子工程系，1982 年本科毕业，1985 年作为国家公派留学生赴美国斯坦福大学攻读博士学位，1990 年获电子工程博士学位。归国后先在中科院某研究所任职，1992 年与三位留学同伴共同创办「华辰电子科技有限公司」，专注于通信芯片研发。1998 年公司完成股份制改造，2003 年在境外上市。现任华辰科技集团董事局名誉主席，并为多所高校的客座教授。育有一子一女。',
'Chen Zhaohua was born in Beijing in November 1955. He grew up as a youth during turbulent years. After the National College Entrance Examination was restored in 1977, he was admitted in the first cohort to the Department of Electronic Engineering at Tsinghua University, graduating with a bachelor\'s degree in 1982. In 1985 he went to Stanford University in the United States as a state-sponsored doctoral student, earning his Ph.D. in Electronic Engineering in 1990. After returning to China he first held a post at a research institute of the Chinese Academy of Sciences. In 1992, together with three fellow returnees from overseas study, he co-founded Huachen Electronic Technology Co., Ltd., focusing on the research and development of communications chips. The company completed its joint-stock restructuring in 1998 and listed overseas in 2003. He currently serves as honorary chairman of the board of Huachen Technology Group and is a visiting professor at several universities. He has one son and one daughter.',
'【家族成员视角】1992 年华辰创立时的四人股权安排原始文件（含两份手写补充协议）现存于家族档案馆 C-2 保险柜。1998 年公司改制涉及的家族信托结构由香港某律师行设计，相关法律文件副本仅家族决策委员会成员可调阅。父亲个人近年因身体原因已逐步将公司事务交由职业经理人，但家族控股结构保持稳定。',
'[Family Members\' Perspective] The original documents of the four-person equity arrangement at Huachen\'s founding in 1992 (including two handwritten supplementary agreements) are now kept in safe-deposit box C-2 of the Family Archive. The family trust structure involved in the company\'s 1998 restructuring was designed by a Hong Kong law firm, and copies of the related legal documents may be accessed only by members of the Family Decision Committee. In recent years Father has, for health reasons, gradually handed over company affairs to professional managers, but the family\'s controlling structure remains stable.',
null, 'public');

p.run('苏文琦', 'Su Wenqi', 1958, null, '第三代 · 母亲', 'Third Generation · Mother',
'苏文琦，1958 年生于杭州。1980 年代留美期间与陈昭华相识，1991 年回国后于北京某高校任教。长期从事中国近代史研究，著有《1920 年代的江南实业家群体》（2006）等学术著作。',
'Su Wenqi was born in Hangzhou in 1958. She met Chen Zhaohua while studying in the United States in the 1980s, and after returning to China in 1991 she taught at a university in Beijing. She has long devoted herself to the study of modern Chinese history and is the author of scholarly works including "The Jiangnan Industrialist Community of the 1920s" (2006).',
null, null, null, 'public');

p.run('陈知远', 'Chen Zhiyuan', 1992, null, '第四代 · 长子', 'Fourth Generation · Eldest Son',
'陈知远，1992 年生于北京。剑桥大学历史系本科、哈佛大学公共政策硕士。现于家族办公室任职，主导本档案项目的发起与日常管理。',
'Chen Zhiyuan was born in Beijing in 1992. He holds a bachelor\'s degree in History from the University of Cambridge and a master\'s degree in Public Policy from Harvard University. He currently works at the Family Office, leading the initiation and day-to-day management of this archive project.',
'【内部】知远自 2022 年起担任家族档案委员会执行秘书，是本档案系统的实际推动者。',
'[Internal] Since 2022 Zhiyuan has served as executive secretary of the Family Archive Committee and is the actual driving force behind this archive system.',
null, 'member');

console.log('  ✓ 7 family members (4 generations)');

// TIMELINE
const t = db.prepare(`INSERT INTO timeline_events (year, month, day, title, title_en, description, description_en, person_id, evidence_status, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const events = [
  [1898, 3, 12, '陈承宗出生于江苏吴县', 'Chen Chengzong born in Wu County, Jiangsu', '族谱与吴县县志双重记载。出生时父亲陈兆元正在江南制造局任文案。', 'Recorded both in the family genealogy and the Wu County gazetteer. At his birth his father Chen Zhaoyuan was serving as a clerk at the Jiangnan Arsenal.', 1, 'verified', 'public'],
  [1903, 9, 6, '林佩兰出生于福州', 'Lin Peilan born in Fuzhou', '据林氏族谱记载，生于福州三坊七巷林宅。', 'According to the Lin family genealogy, she was born at the Lin residence in the Three Lanes and Seven Alleys district of Fuzhou.', 2, 'verified', 'public'],
  [1914, null, null, '陈承宗考入江苏省立第一中学', 'Chen Chengzong admitted to Jiangsu Provincial No. 1 Middle School', '据《江苏省立第一中学校史》记载，承宗以全县第三名考入。', 'According to the "History of Jiangsu Provincial No. 1 Middle School," Chengzong was admitted with the third-highest score in the entire county.', 1, 'verified', 'public'],
  [1919, 8, 23, '陈承宗东渡日本', 'Chen Chengzong sails to Japan', '考入早稻田大学经济学部。原始入学证书现存档案馆。', 'Admitted to the Faculty of Economics at Waseda University. The original admission certificate is held in the Archive.', 1, 'verified', 'public'],
  [1923, null, null, '陈承宗东京毕业', 'Chen Chengzong graduates in Tokyo', '与同窗梁漱溟、李叔同等有书信往来（往来书信现存）。', 'He maintained a correspondence with classmates such as Liang Shuming and Li Shutong (the letters survive).', 1, 'verified', 'public'],
  [1925, 4, 18, '陈承宗与林佩兰成婚', 'Chen Chengzong marries Lin Peilan', '婚礼于上海法租界举行。婚书原件保存。', 'The wedding was held in the French Concession of Shanghai. The original marriage certificate is preserved.', 1, 'verified', 'public'],
  [1925, 8, 4, '陈守仁出生', 'Chen Shouren born', '上海法租界寓所。出生证明现存。', 'At the family residence in the French Concession of Shanghai. The birth certificate survives.', 3, 'verified', 'public'],
  [1928, 6, 11, '陈守德出生', 'Chen Shoude born', '上海。', 'Shanghai.', 4, 'verified', 'public'],
  [1929, null, null, '吴县承裕纺织厂创办', 'Wu County Chengyu Textile Mill founded', '陈承宗与同乡四人合资。原始股权协议现存档案馆 A-2。', 'Co-financed by Chen Chengzong and four fellow townsmen. The original equity agreement is held in Archive box A-2.', 1, 'verified', 'public'],
  [1931, null, null, '承裕小学开学', 'Chengyu Primary School opens', '陈承宗在故乡兴办，首批学生 60 人。', 'Established by Chen Chengzong in his hometown, with a first intake of 60 students.', 1, 'verified', 'public'],
  [1937, 8, 13, '淞沪会战爆发，家族决定西迁', 'Battle of Shanghai breaks out; the family decides to move west', '据曾祖母逃难日记记载。', 'According to Great-Grandmother\'s wartime flight diary.', null, 'verified', 'public'],
  [1937, 10, null, '次女陈宛芳于逃难途中失散', 'Second daughter Chen Wanfang lost during the flight', '据林佩兰 1937 年 11 月日记，约在浙赣边界走散，时年五岁。', 'According to Lin Peilan\'s diary of November 1937, she was separated from the family near the Zhejiang-Jiangxi border, at the age of five.', 2, 'attributed', 'member'],
  [1938, 2, null, '家族抵达昆明与陈承宗会合', 'The family reaches Kunming and reunites with Chen Chengzong', '承裕纺织厂部分骨干随行，在昆明继续小规模生产。', 'Some of the Chengyu Textile Mill\'s key staff came along and continued small-scale production in Kunming.', 1, 'verified', 'public'],
  [1946, null, null, '陈守仁考入西南联大', 'Chen Shouren admitted to Southwest Associated University', '物理学系，师从吴大猷先生。学籍卡现存。', 'Department of Physics, studying under Mr. Wu Ta-You. His enrollment card survives.', 3, 'verified', 'public'],
  [1948, null, null, '陈守德考入中央大学医学院', 'Chen Shoude admitted to the Medical School of National Central University', null, null, 4, 'verified', 'public'],
  [1949, null, null, '家族返回上海', 'The family returns to Shanghai', '承裕纺织厂参与公私合营。', 'The Chengyu Textile Mill entered into a public-private joint operation.', 1, 'verified', 'public'],
  [1950, null, null, '陈守仁清华大学物理系毕业', 'Chen Shouren graduates from the Physics Department of Tsinghua University', '联大复员后转入清华完成学业。', 'After Lianda was demobilized, he transferred to Tsinghua to complete his studies.', 3, 'verified', 'public'],
  [1952, null, null, '陈守仁任教某高校', 'Chen Shouren begins teaching at a university', '半导体物理研究初期。', 'The early period of his semiconductor physics research.', 3, 'verified', 'public'],
  [1955, 11, 23, '陈昭华出生于北京', 'Chen Zhaohua born in Beijing', '父陈守仁，母王素华（已故，1925-2002）。', 'Father Chen Shouren; mother Wang Suhua (deceased, 1925-2002).', 5, 'verified', 'public'],
  [1957, null, null, '陈守仁借调至某科研单位', 'Chen Shouren seconded to a research institution', '工作内容至 2015 年部分解密。', 'The nature of his work was partially declassified only in 2015.', 3, 'verified', 'member'],
  [1958, 5, null, '苏文琦出生于杭州', 'Su Wenqi born in Hangzhou', null, null, 6, 'verified', 'public'],
  [1965, null, null, '陈守仁借调结束，回归高校教学', 'Chen Shouren\'s secondment ends; he returns to university teaching', '工作日志九册原件由家族保管。', 'The nine original volumes of his work journals are kept by the family.', 3, 'verified', 'member'],
  [1976, 9, 15, '陈承宗病逝于上海', 'Chen Chengzong dies of illness in Shanghai', '享年 78 岁。逝世前手书《守拙堂遗训》一卷。', 'At the age of 78. Before his death he wrote out by hand a scroll titled "Testament of the Shouzhuo Hall."', 1, 'verified', 'public'],
  [1977, null, null, '陈昭华参加首批恢复高考', 'Chen Zhaohua sits the first restored College Entrance Examination', '考入清华大学电子工程系。', 'Admitted to the Department of Electronic Engineering at Tsinghua University.', 5, 'verified', 'public'],
  [1985, 8, null, '陈昭华赴美留学', 'Chen Zhaohua goes to the United States to study', '国家公派，斯坦福大学。', 'State-sponsored, at Stanford University.', 5, 'verified', 'public'],
  [1989, 11, 20, '林佩兰逝世于上海', 'Lin Peilan dies in Shanghai', '享年 86 岁。', 'At the age of 86.', 2, 'verified', 'public'],
  [1990, 6, null, '陈昭华获斯坦福电子工程博士', 'Chen Zhaohua earns a Ph.D. in Electronic Engineering from Stanford', '导师为某 IEEE Fellow。', 'His doctoral adviser was an IEEE Fellow.', 5, 'verified', 'public'],
  [1991, null, null, '陈昭华与苏文琦在北京结婚', 'Chen Zhaohua marries Su Wenqi in Beijing', null, null, 5, 'verified', 'public'],
  [1992, 4, 9, '华辰电子科技有限公司创立', 'Huachen Electronic Technology Co., Ltd. founded', '陈昭华与三位留学伙伴合伙创办。四人股权协议原件存档案馆 C-2。', 'Co-founded by Chen Zhaohua and three fellow returnees from overseas study. The original four-person equity agreement is held in Archive box C-2.', 5, 'verified', 'member'],
  [1992, 10, 15, '陈知远出生于北京', 'Chen Zhiyuan born in Beijing', null, null, 7, 'verified', 'public'],
  [1995, 12, 3, '陈守德逝世于哈尔滨', 'Chen Shoude dies in Harbin', '终身未婚。医疗援助日记由档案馆收存。', 'He never married. His medical-aid diaries are held in the Archive.', 4, 'verified', 'public'],
  [1998, null, null, '华辰完成股份制改造', 'Huachen completes its joint-stock restructuring', '引入战略投资人。家族信托结构同期设立。', 'A strategic investor was brought in. The family trust structure was established at the same time.', null, 'verified', 'admin'],
  [2003, 7, null, '华辰科技集团境外上市', 'Huachen Technology Group lists overseas', '上市后家族控股比例 42%。', 'After listing, the family\'s controlling stake stood at 42%.', null, 'verified', 'admin'],
  [2008, 4, 7, '陈守仁病逝于北京', 'Chen Shouren dies of illness in Beijing', '享年 83 岁。生前完成《物理学者的笔记》修订版。', 'At the age of 83. Before his death he completed the revised edition of "Notes of a Physicist."', 3, 'verified', 'public'],
  [2014, null, null, '陈知远剑桥大学历史系毕业', 'Chen Zhiyuan graduates from the History Department of the University of Cambridge', null, null, 7, 'verified', 'public'],
  [2017, null, null, '陈知远哈佛公共政策硕士毕业', 'Chen Zhiyuan earns a master\'s in Public Policy from Harvard', null, null, 7, 'verified', 'public'],
  [2022, 3, null, '家族档案委员会成立', 'Family Archive Committee established', '陈知远任执行秘书，启动家族档案系统化工程。', 'Chen Zhiyuan serves as executive secretary, launching the systematic effort to organize the family archive.', 7, 'verified', 'member'],
  [2024, null, null, '家族档案数字化工程一期完成', 'Phase One of the family archive digitization project completed', '完成约 12,000 件物证的扫描、标注与索引。', 'Around 12,000 physical artifacts were scanned, annotated, and indexed.', null, 'verified', 'member'],
];
for (const e of events) {
  try { t.run(...e); }
  catch (err) { console.error('Failed at event:', e); throw err; }
}
console.log(`  ✓ ${events.length} timeline events`);

// ARCHIVE
const a = db.prepare(`INSERT INTO archive_items (title, title_en, kind, description, description_en, date_taken, location, location_en, file_url, thumb_url, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const archives = [
  ['陈兆元举人功名牌位（拓片）', 'Chen Zhaoyuan Juren Honor Tablet (Rubbing)', 'document', '陈氏曾祖父，清光绪年间江苏吴县乡试中举功名牌位拓片，1985 年由族中长辈拓制。原牌位现存吴县老宅祠堂。', 'A rubbing of the honor tablet of the family\'s great-grandfather, who passed the provincial examination (juren) in Wu County, Jiangsu, during the Guangxu reign of the Qing dynasty; the rubbing was made by a family elder in 1985. The original tablet is kept in the ancestral hall of the old family home in Wu County.', '1885', '江苏吴县', 'Wu County, Jiangsu', 'public'],
  ['陈承宗早稻田毕业纪念照', 'Chen Chengzong\'s Waseda Graduation Photograph', 'photo', '1923 年与同窗合影共 11 人，承宗居前排右二。背景为早稻田大学大隈讲堂。', 'A 1923 group photograph of 11 classmates, with Chengzong second from the right in the front row. The background is the Okuma Auditorium at Waseda University.', '1923-07-15', '东京', 'Tokyo', 'public'],
  ['陈承宗与林佩兰婚书', 'Marriage Certificate of Chen Chengzong and Lin Peilan', 'document', '1925 年成婚时所立。中式立轴婚书，毛笔楷书，有双方家长印鉴。', 'Issued at their wedding in 1925. A Chinese-style hanging-scroll marriage certificate in brush regular script, bearing the seals of both sets of parents.', '1925-04-18', '上海法租界', 'French Concession, Shanghai', 'public'],
  ['承裕纺织厂落成合影', 'Chengyu Textile Mill Completion Group Photo', 'photo', '1929 年纺织厂落成日，承宗与四位合伙人及工人代表合影。', 'A group photograph taken on the day the textile mill was completed in 1929, with Chengzong, his four partners, and worker representatives.', '1929-10', '江苏吴县', 'Wu County, Jiangsu', 'public'],
  ['承裕小学第一届毕业合影', 'Chengyu Primary School First Graduating Class Photo', 'photo', '1933 年承裕小学首届学生（共 24 人）与陈承宗、校董合影。', 'A 1933 group photograph of the first class of Chengyu Primary School students (24 in all) with Chen Chengzong and the school trustees.', '1933-06', '江苏吴县', 'Wu County, Jiangsu', 'public'],
  ['陈承宗著《商业伦理刍议》', 'Chen Chengzong\'s "A Modest Discourse on Business Ethics"', 'document', '1934 年自费印行小册子，论述实业家应有的社会责任。', 'A pamphlet self-published in 1934, discussing the social responsibilities that industrialists ought to bear.', '1934', '上海', 'Shanghai', 'public'],
  ['家族祠堂老照片（西迁前）', 'Old Photograph of the Family Ancestral Hall (Before the Westward Move)', 'photo', '约 1936 年，承宗一家与族人在吴县老宅祠堂前合影。共 23 人。', 'Circa 1936, a group photograph of Chengzong\'s family and relatives in front of the ancestral hall at the old family home in Wu County. 23 people in all.', '1936', '江苏吴县', 'Wu County, Jiangsu', 'public'],
  ['陈承宗逝世讣告', 'Chen Chengzong\'s Obituary Notice', 'document', '1976 年讣告原件，由长子陈守仁拟定。', 'The original 1976 obituary notice, drafted by his eldest son Chen Shouren.', '1976-09', '上海', 'Shanghai', 'public'],
  ['陈守仁与吴大猷先生合影', 'Photograph of Chen Shouren with Mr. Wu Ta-You', 'photo', '约 1948 年，西南联大物理系师生合影。', 'Circa 1948, a group photograph of faculty and students of the Physics Department at Southwest Associated University.', '1948', '昆明', 'Kunming', 'public'],
  ['陈昭华博士学位证书', 'Chen Zhaohua\'s Doctoral Degree Certificate', 'document', '1990 年斯坦福大学电子工程系博士学位证书复印件。', 'A copy of the 1990 Ph.D. degree certificate from the Department of Electronic Engineering at Stanford University.', '1990-06', 'Stanford', 'Stanford', 'public'],
  ['林佩兰逃难日记 (1937-1938)', 'Lin Peilan\'s Wartime Flight Diary (1937-1938)', 'document', '六册手写日记，记录从上海经香港转赴昆明全程。第三册第 47 页有次女走失当日记录，墨迹被泪水晕开。', 'Six volumes of handwritten diaries recording the entire journey from Shanghai via Hong Kong to Kunming. On page 47 of the third volume is the entry from the day her second daughter was lost, the ink blurred by tears.', '1937', '逃难途中', 'En route during the flight', 'member'],
  ['陈承宗与梁漱溟往来书信', 'Correspondence Between Chen Chengzong and Liang Shuming', 'document', '共 37 封，时间跨度 1924-1952。讨论乡村建设、儒家伦理与实业问题。', '37 letters in all, spanning 1924-1952. They discuss rural reconstruction, Confucian ethics, and questions of industry.', '1924', '多地', 'Various places', 'member'],
  ['陈承宗《守拙堂遗训》誊抄本', 'Transcribed Copy of Chen Chengzong\'s "Testament of the Shouzhuo Hall"', 'document', '1976 年承宗病榻手书，由长子守仁誊抄三份，此为家族档案馆收藏的第一份。', 'Handwritten by Chengzong on his sickbed in 1976 and transcribed into three copies by his eldest son Shouren; this is the first copy held by the Family Archive.', '1976-09-12', '上海', 'Shanghai', 'member'],
  ['陈守仁西南联大学籍卡', 'Chen Shouren\'s Southwest Associated University Enrollment Card', 'document', '1946 年入学时填写，含照片。家族馆 1998 年获赠复印件。', 'Filled out at his enrollment in 1946, including a photograph. The Family Archive received a copy as a gift in 1998.', '1946-09', '昆明', 'Kunming', 'member'],
  ['1957 年实验室合影', '1957 Laboratory Group Photo', 'photo', '陈守仁与七位同事在某高校半导体实验室门前合影。', 'A group photograph of Chen Shouren and seven colleagues in front of a university semiconductor laboratory.', '1957-11', '北京', 'Beijing', 'member'],
  ['陈守仁工作日志（部分）', 'Chen Shouren\'s Work Journal (Partial)', 'document', '1957-1965 年间工作日志，本件为第三册（1959 年）。', 'Work journals from 1957-1965; this item is the third volume (1959).', '1959', '北京', 'Beijing', 'member'],
  ['陈昭华留美家书', 'Chen Zhaohua\'s Family Letters from the United States', 'document', '1985-1990 年间陈昭华自斯坦福写给父母的家书，共 84 封。', 'Family letters written by Chen Zhaohua to his parents from Stanford between 1985 and 1990, 84 in all.', '1985', 'Stanford', 'Stanford', 'member'],
  ['陈承宗藏书清单（地窖出土）', 'Chen Chengzong\'s Book Collection Inventory (Recovered from the Cellar)', 'document', '1980 年代从吴县老宅祠堂地窖取出的藏书清单，记录线装书 247 部，新式书籍 318 册。', 'An inventory of the book collection retrieved in the 1980s from the cellar of the ancestral hall at the old family home in Wu County, listing 247 thread-bound classical works and 318 modern-style books.', '1980', '江苏吴县', 'Wu County, Jiangsu', 'member'],
  ['家族西迁路线手绘地图', 'Hand-Drawn Map of the Family\'s Westward Migration Route', 'document', '由林佩兰口述、陈守仁 1985 年手绘，标注 1937-1938 西迁详细路线与停留点。', 'Dictated by Lin Peilan and hand-drawn by Chen Shouren in 1985, marking the detailed 1937-1938 westward route and stopping points.', '1985', '上海', 'Shanghai', 'member'],
  ['二叔公陈守德边疆医疗日记', 'Great-Granduncle Chen Shoude\'s Frontier Medical Diary', 'document', '1962-1968 年边疆医疗援助期间日记，共四册。涉及部分敏感内容。', 'Diaries from his 1962-1968 frontier medical-aid service, four volumes in all. They contain some sensitive material.', '1962', '边疆地区', 'Frontier region', 'member'],
  ['1992 年华辰创立四人协议（原件）', 'Huachen\'s 1992 Founding Four-Person Agreement (Original)', 'document', '陈昭华与三位创业伙伴的原始股权协议，含两份手写补充条款。', 'The original equity agreement between Chen Zhaohua and his three founding partners, including two handwritten supplementary clauses.', '1992-04-09', '北京', 'Beijing', 'admin'],
  ['1998 年华辰股改方案与家族信托结构图', 'Huachen\'s 1998 Restructuring Plan and Family Trust Structure Chart', 'document', '由香港某律师行设计的家族信托结构，仅供家族决策委员会调阅。', 'The family trust structure designed by a Hong Kong law firm, available for review only by the Family Decision Committee.', '1998', '香港', 'Hong Kong', 'admin'],
  ['家族决策委员会章程', 'Charter of the Family Decision Committee', 'document', '2022 年制定，规定家族重大事项决策机制。', 'Drawn up in 2022, setting out the decision-making mechanism for major family matters.', '2022', '北京', 'Beijing', 'admin'],
];
for (const x of archives) a.run(x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], null, null, x[8]);
console.log(`  ✓ ${archives.length} archive items`);

// ORAL HISTORIES
const o = db.prepare(`INSERT INTO oral_histories (title, title_en, speaker, speaker_en, recorded_date, duration_minutes, transcript, transcript_en, audio_url, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const orals = [
  ['祖父谈西南联大岁月', 'Grandfather on His Years at Southwest Associated University', '陈守仁', 'Chen Shouren', '2005-06-12', 47,
'那时候大家什么都没有，但什么都不缺。物质极简，精神极丰。我们晚上没有电，就在油灯下读书。吴先生讲量子力学，黑板被雨水浇湿了，他就拿手抹一下继续讲。没有人觉得这是苦——这就是日常。我后来教了一辈子物理，最常想起的，还是 1947 年那个雨夜。',
'In those days everyone had nothing, yet nothing was lacking. Materially we lived with the barest minimum, but spiritually we were rich beyond measure. At night we had no electricity, so we read by oil lamp. When Mr. Wu lectured on quantum mechanics, the blackboard would get soaked by the rain, and he would simply wipe it with his hand and carry on. No one felt this was hardship—it was simply daily life. I went on to teach physics my whole life, and what I think of most often is still that rainy night in 1947.',
    'public'],
  ['父亲谈归国创业初衷', 'Father on Why He Returned Home to Start a Business', '陈昭华', 'Chen Zhaohua', '2018-03-20', 62,
'1990 年从斯坦福毕业，导师劝我留下。当时硅谷的机会非常多。我犹豫了几个月。最后让我下决心回国的，不是大道理，是一封我祖父给我的信。他说：「读书人，要看你这一生有没有让你脚下的这片土地变得更好一点。」就是这句话。1992 年回到北京，借了三个朋友的钱，租了一间办公室，就开始做了。',
'When I graduated from Stanford in 1990, my adviser urged me to stay. There were so many opportunities in Silicon Valley back then. I hesitated for several months. In the end, what made up my mind to return home was not some grand principle, but a letter from my grandfather. He wrote: "For a man of learning, what matters is whether, over the course of your life, you have made the land beneath your feet a little better." That was the line. In 1992 I returned to Beijing, borrowed money from three friends, rented an office, and just got started.',
    'public'],
  ['母亲谈杭州童年与南渡北归', 'Mother on Her Hangzhou Childhood and Her Journeys South and North', '苏文琦', 'Su Wenqi', '2019-04-15', 38,
'我祖父是民国时杭州的中医。他常说，江南这块地，每一寸都有故事。我后来做近代史研究，其实根子就在小时候听他讲的那些。1980 年代我去美国，第一次离家那么远，反而把江南的事情看得更清楚了。',
'My grandfather was a practitioner of traditional Chinese medicine in Hangzhou during the Republican era. He often said that every inch of this Jiangnan land holds a story. My later research in modern history truly took root in the things I heard him tell as a child. When I went to America in the 1980s, the first time I had been so far from home, it actually let me see Jiangnan more clearly.',
    'public'],
  ['知远谈启动家族档案项目', 'Zhiyuan on Launching the Family Archive Project', '陈知远', 'Chen Zhiyuan', '2023-01-10', 28,
'2021 年祖母过世的时候，我们整理她的遗物，发现她保留了我太祖母的逃难日记。一打开，纸张就有掉渣的迹象。那一刻我意识到：再不开始，很多东西就来不及了。这不是个浪漫的决定，是被时间逼出来的。',
'When my grandmother passed away in 2021 and we were sorting through her belongings, we discovered that she had kept my great-grandmother\'s wartime flight diary. The moment we opened it, the paper was already beginning to crumble. In that instant I realized: if we did not start now, it would be too late for many things. This was not a romantic decision—it was one forced upon us by time.',
    'public'],
  ['曾祖母谈 1937 年的逃难', 'Great-Grandmother on the Flight of 1937', '林佩兰', 'Lin Peilan', '1987-09-08', 90,
'我这辈子最难讲的事，就是 1937 年那个秋天。从上海走的时候，我抱着小宛芳，她那时候五岁，会唱歌。船到宁波，再换火车往西。那一夜在浙赣边界，火车站乱得不成样子。我手里牵着大女儿，背上背着小儿子，宛芳就跟在我边上拉着我的衣角。等我反应过来，她就不见了。我喊了一夜——可是天亮以后，列车不等人。这件事，我没有跟承宗讲过完整的经过。',
'The hardest thing to speak of in my whole life is that autumn of 1937. When we left Shanghai, I was carrying little Wanfang in my arms; she was five then, and she could sing. The boat reached Ningbo, and then we changed to a train heading west. That night, at the Zhejiang-Jiangxi border, the railway station was in utter chaos. I held my eldest daughter by the hand and carried my little son on my back, and Wanfang was right beside me, tugging at the hem of my clothes. By the time I came to my senses, she was gone. I called out all night long—but once dawn came, the train would not wait. The full story of this, I never told Chengzong.',
    'member'],
  ['二叔公谈边疆医疗援助', 'Great-Granduncle on Frontier Medical Aid', '陈守德', 'Chen Shoude', '1990-07-22', 55,
'1962 到 1968 年，我在西北边境的医疗队。那个年代，物资极度匮乏，我们一个医生要负责几百公里的牧民。冬天零下三十度，骑马走三天才能到一户人家。一年下来，能救活的孩子，可能也就十几个。但只要救活一个，那个家就完整了。这是我一辈子最骄傲的事。',
'From 1962 to 1968 I served with a medical team on the northwestern frontier. In those years supplies were desperately scarce, and a single doctor was responsible for herders spread across hundreds of kilometers. In winter it was thirty degrees below zero, and you had to ride three days on horseback to reach a single household. Over the course of a year, the children we managed to save might number only a dozen or so. But as long as you saved even one, that family was made whole again. This is the thing I am proudest of in my whole life.',
    'member'],
  ['祖父晚年关于 1957-1965 的口述（节选）', 'Grandfather\'s Late-Life Account of 1957-1965 (Excerpt)', '陈守仁', 'Chen Shouren', '2007-11-30', 73,
'这段经历，我跟昭华讲过一些，但很多细节我没有讲。不是不愿意讲，是我自己也没有完全想清楚，有些事情发生的时候，你不知道你在参与什么。等你三十年后回头看，你也不一定看得清楚。我现在留下这段录音，算是一个交代——但请你们也帮我留一点克制，不要急着把它公开。',
'This part of my life I have told Zhaohua something of, but many of the details I have left unspoken. It is not that I am unwilling to speak of them; it is that I myself have never fully sorted them out. When some things happen, you do not know what you are taking part in. And even looking back thirty years later, you may still not see it clearly. I am leaving this recording now as a kind of accounting—but please, for my sake, exercise some restraint, and do not be in a hurry to make it public.',
    'admin'],
  ['关于 1992 年股权安排的口述', 'An Account of the 1992 Equity Arrangement', '陈昭华', 'Chen Zhaohua', '2024-09-14', 41,
'1992 年创业的时候，四个人是真朋友。我们在斯坦福同住过宿舍。回国之后第一笔启动资金是我个人借的，但当时为了让大家有信心，我把股权平均分了。后来 1998 年股改之前，我们四个又坐下来谈了一次，那次的细节，是这家公司今天结构的根基。我把这段讲完，就算把家族最重要的一道账，给后人交代清楚了。',
'When we started the business in 1992, the four of us were true friends. We had shared a dormitory at Stanford. After returning to China, the first round of startup capital was borrowed in my own name, but at the time, to give everyone confidence, I divided the equity equally among us. Later, before the 1998 restructuring, the four of us sat down and talked once more, and the details of that conversation are the foundation of this company\'s structure today. Once I have finished telling this part, I will have given a clear accounting to future generations of the family\'s most important matter of record.',
    'admin'],
];
for (const r of orals) o.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], null, r[8]);
console.log(`  ✓ ${orals.length} oral histories`);

console.log('\n✅ Seeding complete!\n');
console.log('Demo accounts:');
console.log('  👑 admin   / admin123    管理员 - 全部权限');
console.log('  👨‍👩‍👧 family  / family123   家族成员 - 可查看私密档案');
console.log('  👁 guest   / guest123    访客 - 只能看公开内容');

// Force WAL checkpoint and close
db.pragma('wal_checkpoint(TRUNCATE)');
db.close();
console.log('\n  ✓ DB checkpoint + close');
