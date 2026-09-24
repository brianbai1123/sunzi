# Shared helpers for chapter records.

def P(pos, text, decode, why, do, avoid):
    return {
        "pos": pos,
        "text": text,
        "decode": decode,
        "why": why,
        "do": do,
        "avoid": avoid,
    }


def S(name, view, understand, core, logic, plain, check):
    return {
        "name": name,
        "view": view,
        "understand": understand,
        "core": core,
        "logic": logic,
        "plain": plain,
        "check": check,
    }


def chapter(id, name, pinyin, alias, seal, section, keyword, one, plain, passages, scholars, contrast):
    return {
        "id": id,
        "name": name,
        "pinyin": pinyin,
        "alias": alias,
        "seal": seal,
        "section": section,
        "keyword": keyword,
        "oneLiner": one,
        "plain": plain,
        "passages": passages,
        "scholars": scholars,
        "contrast": contrast,
    }
