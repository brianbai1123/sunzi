#!/usr/bin/env python3
"""Build data/chapters.json and data/essentials.json."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from chapters_1_4 import C1, C2, C3, C4
from chapters_5_8 import C5, C6, C7, C8
from chapters_9_13 import C9, C10, C11, C12, C13

CHAPTERS = [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13]

ESSENTIALS = {
    "title": "兵法精要",
    "note": "从十三篇抽出最该先背的句子。每句都能回到原篇，不代替全文。",
    "arc": "始计索情，作战算费，谋攻求全。军形先立于不败，兵势以奇正释放力量，虚实把力量用在对方没有准备的点。军争解决如何先到，九变允许例外，行军负责处军相敌。地形分六形六败，九地处理深入之后的军心，火攻把猛手段收束为慎战，用间把知彼落到具体的人。读完是一个圈：情报进入计算，计算进入行动，行动再产生新的情报。",
    "cards": [
        {"title": "国之大事", "from": "始计", "classic": "兵者，国之大事，死生之地，存亡之道，不可不察也。", "plain": "用兵关系到生死存亡，所以第一件事是考察，不是鼓动。", "recite": "不可不察"},
        {"title": "五事", "from": "始计", "classic": "一曰道，二曰天，三曰地，四曰将，五曰法。", "plain": "道是上下同心，天是时机，地是环境，将是五德，法是制度与后勤。", "recite": "道天地将法"},
        {"title": "七计", "from": "始计", "classic": "主孰有道？将孰有能？天地孰得？法令孰行？兵众孰强？士卒孰练？赏罚孰明？", "plain": "七个「孰」都是双方比较，不是自我感觉。", "recite": "吾以此知胜负矣"},
        {"title": "诡道", "from": "始计", "classic": "兵者，诡道也。攻其无备，出其不意。", "plain": "示形是对敌军隐藏意图。它排在五事七计之后，不能代替计算，也不能拿来欺骗合作的人。", "recite": "攻其无备，出其不意"},
        {"title": "庙算", "from": "始计", "classic": "多算胜，少算不胜，而况于无算乎！", "plain": "有利条件多，胜算大。完全不算，不值得开打。", "recite": "多算胜，少算不胜"},
        {"title": "拙速", "from": "作战", "classic": "兵闻拙速，未睹巧之久也。", "plain": "笨而快，好过巧而久。久战会耗尽国力。", "recite": "不尽知害，不能尽知利"},
        {"title": "因粮于敌", "from": "作战", "classic": "食敌一钟，当吾二十钟。", "plain": "远途运输的损耗极大。能在现场解决的，不要反复从后方搬运。", "recite": "智将务食于敌"},
        {"title": "兵贵胜", "from": "作战", "classic": "兵贵胜，不贵久。", "plain": "胜利要收束。持久本身不是光荣。", "recite": "知兵之将，生民之司命"},
        {"title": "全胜", "from": "谋攻", "classic": "不战而屈人之兵，善之善者也。", "plain": "百战百胜仍有损耗。最好是目的达到而少破坏。", "recite": "全国为上，破国次之"},
        {"title": "上兵伐谋", "from": "谋攻", "classic": "上兵伐谋，其次伐交，其次伐兵，其下攻城。", "plain": "先破计划，再破联盟，然后才是野战。攻城是不得已。", "recite": "攻城之法，为不得已"},
        {"title": "知彼知己", "from": "谋攻", "classic": "知彼知己，百战不殆；不知彼而知己，一胜一负；不知彼不知己，每战必殆。", "plain": "三层都要背。原文是不陷入危殆，不是保证永远赢。", "recite": "知彼知己，百战不殆"},
        {"title": "先为不可胜", "from": "军形", "classic": "先为不可胜，以待敌之可胜。", "plain": "不会败靠自己，能胜靠敌人露出空隙。", "recite": "胜可知，而不可为"},
        {"title": "先胜后战", "from": "军形", "classic": "胜兵先胜而后求战，败兵先战而后求胜。", "plain": "先有必胜的形势再打。先打再盼胜利，是败兵。", "recite": "立于不败之地"},
        {"title": "以镒称铢", "from": "军形", "classic": "胜兵若以镒称铢，败兵若以铢称镒。", "plain": "形是已经称出来的实力差，大到像决开千仞的积水。", "recite": "度、量、数、称、胜"},
        {"title": "奇正", "from": "兵势", "classic": "凡战者，以正合，以奇胜。", "plain": "正兵接住，奇兵取胜。两者循环相生，没有终点。", "recite": "奇正相生，循环无端"},
        {"title": "势险节短", "from": "兵势", "classic": "善战者，其势险，其节短。势如彍弩，节如发机。", "plain": "准备可以长，出手要短，像拉满的弩一触即发。", "recite": "势险节短"},
        {"title": "任势", "from": "兵势", "classic": "求之于势，不责于人，故能择人而任势。", "plain": "先改结构和位置，再评价个人。像把圆石转到山上。", "recite": "转圆石于千仞之山"},
        {"title": "致人", "from": "虚实", "classic": "善战者，致人而不致于人。", "plain": "调动敌人，不被敌人调动。时间和地点要由自己选定。", "recite": "致人而不致于人"},
        {"title": "我专敌分", "from": "虚实", "classic": "我专为一，敌分为十，是以十攻其一也。", "plain": "处处防备则处处薄弱。让别人来防你，你才显得多。", "recite": "无所不备，则无所不寡"},
        {"title": "避实击虚", "from": "虚实", "classic": "兵之形，避实而击虚。水因地而制流，兵因敌而制胜。", "plain": "像水避开高处。能随敌人变化而取胜，才叫做神。", "recite": "兵无常势，水无常形"},
        {"title": "以迂为直", "from": "军争", "classic": "以迂为直，以患为利。后人发，先人至。", "plain": "绕路、诱开对方，后出发却先到达。这是军争最难的地方。", "recite": "知迂直之计"},
        {"title": "辎重", "from": "军争", "classic": "军无辎重则亡，无粮食则亡，无委积则亡。", "plain": "为了快丢掉补给，快本身会变成灭亡。", "recite": "军争为利，军争为危"},
        {"title": "治气", "from": "军争", "classic": "避其锐气，击其惰归。", "plain": "朝气锐，昼气惰，暮气归。不要在对方最锐的时候硬接。", "recite": "三军可夺气，将军可夺心"},
        {"title": "八戒", "from": "军争", "classic": "归师勿遏，围师必阙，穷寇勿迫。", "plain": "八戒是负面清单。包围留缺口，走投无路的敌人不要逼成死战。", "recite": "佯北勿从，饵兵勿食"},
        {"title": "有所不受", "from": "九变", "classic": "途有所不由，军有所不击，城有所不攻，地有所不争，君命有所不受。", "plain": "「有所」是限制。只有现场遵行会失败时，才改变手段，目的不能私自换掉。", "recite": "通于九变"},
        {"title": "杂于利害", "from": "九变", "classic": "智者之虑，必杂于利害。", "plain": "利里想到害，事情才可靠；害里想到利，祸患才解得开。", "recite": "杂于利，杂于害"},
        {"title": "有以待", "from": "九变", "classic": "无恃其不来，恃吾有以待也；无恃其不攻，恃吾有所不可攻也。", "plain": "不要指望对方不来。把自己做成不可攻。", "recite": "恃吾有以待"},
        {"title": "五危", "from": "九变", "classic": "必死，可杀也；必生，可虏也；忿速，可侮也；廉洁，可辱也；爱民，可烦也。", "plain": "性格一旦变成「必」，就会被利用。美德用过了也是灾。", "recite": "将有五危"},
        {"title": "半济而击", "from": "行军", "classic": "令半济而击之，利。", "plain": "敌人渡河，等他过到一半再打。处军先选地，再相敌。", "recite": "处军相敌"},
        {"title": "兵非益多", "from": "行军", "classic": "兵非益多也，惟无武进，足以并力、料敌、取人而已。", "plain": "人多不能代替判断。没有深虑又轻敌，一定被捉。", "recite": "无虑而易敌者，必擒于人"},
        {"title": "令文齐武", "from": "行军", "classic": "令之以文，齐之以武，是谓必取。", "plain": "先亲附再惩罚；亲附之后，该罚必须罚。平时命令能执行，临时才有用。", "recite": "与众相得"},
        {"title": "六败", "from": "地形", "classic": "凡此六者，非天之灾，将之过也。", "plain": "走、弛、陷、崩、乱、北，都是将领的责任，不是命运。", "recite": "非天之灾，将之过"},
        {"title": "国之宝", "from": "地形", "classic": "进不求名，退不避罪，唯人是保，而利合于主，国之宝也。", "plain": "进退为了保全民众和君主的根本利益，不为了个人名声。", "recite": "进不求名，退不避罪"},
        {"title": "知天知地", "from": "地形", "classic": "知彼知己，胜乃不殆；知天知地，胜乃不穷。", "plain": "只知敌我、不知地形，仍只有一半胜算。", "recite": "动而不迷，举而不穷"},
        {"title": "九地", "from": "九地", "classic": "散地则无战，轻地则无止，争地则无攻，交地则无绝，衢地则合交，重地则掠，圮地则行，围地则谋，死地则战。", "plain": "地不同，做法相反。先命名，再行动。", "recite": "九地九法"},
        {"title": "率然", "from": "九地", "classic": "击其首则尾至，击其尾则首至，击其中则首尾俱至。", "plain": "像同船遇风，形势让人互相救援。绑住并不可靠。", "recite": "携手若使一人"},
        {"title": "亡地然后存", "from": "九地", "classic": "投之亡地然后存，陷之死地然后生。", "plain": "「然后」不能省。没有粮、没有方向的死地，只是真的亡。", "recite": "深则专，浅则散"},
        {"title": "处女脱兔", "from": "九地", "classic": "始如处女，敌人开户；后如脱兔，敌不及拒。", "plain": "先沉静到对方开门，再快到他来不及抵抗。", "recite": "践墨随敌"},
        {"title": "非利不动", "from": "火攻", "classic": "非利不动，非得不用，非危不战。", "plain": "没有利、没有得、没有危迫，就不要动用战争。", "recite": "合于利而动"},
        {"title": "不可以怒", "from": "火攻", "classic": "主不可以怒而兴师，将不可以愠而致战。", "plain": "怒会过去，亡国和死亡不会回来。", "recite": "安国全军之道"},
        {"title": "必取于人", "from": "用间", "classic": "先知者，不可取于鬼神，不可象于事，不可验于度，必取于人。", "plain": "知道敌情只能靠人，不能靠鬼神和空算。", "recite": "知敌之情者"},
        {"title": "五间", "from": "用间", "classic": "五间俱起，莫知其道，是谓神纪，人君之宝也。", "plain": "因间、内间、反间、死间、生间一起用。枢纽是反间。", "recite": "反间不可不厚"},
        {"title": "上智为间", "from": "用间", "classic": "能以上智为间者，必成大功。此兵之要，三军之所恃而动也。", "plain": "三军靠先知行动。最重要的信息，要最懂的人去核。", "recite": "三军之所恃而动"},
    ],
}

REQUIRED = [
    "兵者，国之大事",
    "多算胜",
    "兵闻拙速",
    "兵贵胜，不贵久",
    "不战而屈人之兵",
    "知彼知己，百战不殆",
    "先为不可胜",
    "胜兵先胜而后求战",
    "以正合，以奇胜",
    "致人而不致于人",
    "避实而击虚",
    "以迂为直",
    "君命有所不受",
    "令之以文，齐之以武",
    "进不求名，退不避罪",
    "投之亡地然后存",
    "主不可以怒而兴师",
    "必取于人",
]


def main():
    assert len(CHAPTERS) == 13
    ids = [c["id"] for c in CHAPTERS]
    assert ids == list(range(1, 14)), ids
    blob = json.dumps(CHAPTERS, ensure_ascii=False)
    missing = [s for s in REQUIRED if s not in blob]
    if missing:
        raise SystemExit("missing canonical lines: " + "、".join(missing))
    for c in CHAPTERS:
        for key in ("scene", "core", "plain", "story", "wisdom", "practice", "recite"):
            if not c["plain"].get(key):
                raise SystemExit(f"{c['name']} plain.{key} empty")
        if len(c["passages"]) < 4:
            raise SystemExit(f"{c['name']} passages too few")
        if len(c["scholars"]) != 6:
            raise SystemExit(f"{c['name']} scholars")
        for p in c["passages"]:
            for k in ("pos", "text", "decode", "why", "do", "avoid"):
                if not str(p.get(k, "")).strip():
                    raise SystemExit(f"{c['name']} {p.get('pos')} {k} empty")
        for s in c["scholars"]:
            for k in ("name", "view", "understand", "core", "logic", "plain", "check"):
                if not str(s.get(k, "")).strip():
                    raise SystemExit(f"{c['name']} {s.get('name')} {k} empty")
    out = ROOT / "data"
    out.mkdir(exist_ok=True)
    (out / "chapters.json").write_text(json.dumps(CHAPTERS, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "essentials.json").write_text(json.dumps(ESSENTIALS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"chapters {len(CHAPTERS)} passages {sum(len(c['passages']) for c in CHAPTERS)} essentials {len(ESSENTIALS['cards'])}")


if __name__ == "__main__":
    main()
