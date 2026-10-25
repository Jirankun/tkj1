#!/usr/bin/env python3
"""Bangun student/index.html dari data/*.json.

Sumber data (folder data/):
  data/ld.json          -> isi <script type="application/ld+json"> di <head>
  data/memberlist.json  -> blok kartu anggota di dalam .container section#daftar

student/index.html adalah template: dua penanda komentar di dalamnya menentukan
titik suntik. Skrip ini idempoten — kalau hasil build sama dengan isi halaman,
file tidak ditulis dan workflow tidak membuat commit.

Skema data/memberlist.json (semua key wajib ada di setiap anggota):
    name       wajib, unik
    tone       warna kartu 0-360
    photo      path/URL foto; "" -> inisial otomatis dari name
    instagram  URL profil; "" -> nama tampil tanpa tautan
    audio      path/URL audio; "" -> pemutar nonaktif tanpa tag <audio>

Jalankan lokal:
    python3 scripts/build-student.py
"""

from __future__ import annotations

import html
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "student" / "index.html"
LD_SOURCE = ROOT / "data" / "ld.json"
MEMBERS_SOURCE = ROOT / "data" / "memberlist.json"

BUILD_NAME = "scripts/build-student.py"
MAX_WIDTH = 120          # batas panjang baris sebelum atribut dipecah
# Skema seragam: semua key wajib ada di setiap anggota. Nilai "" berarti
# bagian itu tidak dibuatkan tag HTML-nya (photo -> inisial dari name).
MEMBER_KEYS = ("name", "tone", "photo", "instagram", "audio")
PAGE_INDENT = " " * 20   # indentasi blok memberlist di dalam .container
LD_INDENT = " " * 12     # indentasi isi <script type="application/ld+json">
TEMPLATE_NEEDLE = "memberlist ada di data/memberlist.json"
REMOTE_RE = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//)", re.I)


def fail(message: str) -> None:
    print(f"build-student: {message}", file=sys.stderr)
    raise SystemExit(1)


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        fail(f"tidak bisa membaca {display_path(path)}: {exc}")
    except json.JSONDecodeError as exc:
        fail(f"{display_path(path)} bukan JSON valid: {exc}")


def asset_href(value: str) -> str:
    """URL absolut dibiarkan; path relatif repo dibuat relatif terhadap student/."""
    if REMOTE_RE.match(value):
        return value
    return "../" + (value[2:] if value.startswith("./") else value)


def image_size(path: Path):
    """Lebar x tinggi intrinsik PNG/JPEG tanpa dependensi tambahan."""
    try:
        raw = path.read_bytes()
    except OSError:
        return None
    if raw[:8] == b"\x89PNG\r\n\x1a\n" and len(raw) >= 24:
        return struct.unpack(">II", raw[16:24])
    if raw[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(raw):
            if raw[i] != 0xFF:
                i += 1
                continue
            marker = raw[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                height, width = struct.unpack(">HH", raw[i + 5:i + 9])
                return width, height
            if marker == 0xD8 or 0xD0 <= marker <= 0xD9:
                i += 2
                continue
            if i + 4 > len(raw):
                break
            i += 2 + struct.unpack(">H", raw[i + 2:i + 4])[0]
    return None


def initials(name: str) -> str:
    parts = [part for part in re.split(r"\s+", name) if part]
    letters = [part[0] for part in parts if part[0].isalnum()]
    return "".join(letters[:2]).upper() or "?"


def tag(indent: str, name: str, attrs: list[str], inner: str | None = None, block_inner: bool = False) -> str:
    """Satu baris bila muat; kalau tidak, satu atribut per baris.

    block_inner=True dipakai untuk isi berupa elemen (mis. <i> di dalam
    <button> atau <audio> kosong) agar penutup tag tidak menempel ke atribut.
    """
    attr_text = "".join(f" {attr}" for attr in attrs)
    if inner is None:
        if len(f"{indent}<{name}{attr_text} />") <= MAX_WIDTH:
            return f"{indent}<{name}{attr_text} />"
        rows = "\n".join(f"{indent}    {attr}" for attr in attrs)
        return f"{indent}<{name}\n{rows}\n{indent}/>"
    if len(f"{indent}<{name}{attr_text}>{inner}</{name}>") <= MAX_WIDTH or not attrs:
        return f"{indent}<{name}{attr_text}>{inner}</{name}>"
    rows = "\n".join(f"{indent}    {attr}" for attr in attrs)
    if block_inner:
        inner_part = f"\n{indent}    {inner}" if inner else ""
        return f"{indent}<{name}\n{rows}\n{indent}>{inner_part}\n{indent}</{name}>"
    return f"{indent}<{name}\n{rows}\n{indent}>{inner}</{name}>"


def render_member(member: dict, number: int) -> str:
    name = member["name"]
    label = html.escape(name)
    tone = member.get("tone", 200)
    out = [f'    <div class="member-cell" style="--tone: {tone}">']
    out.append(f'        <span class="member-no" aria-hidden="true">{number:02d}</span>')

    # ---- Media: foto (bila ada) atau inisial otomatis dari name ----
    photo = member.get("photo")
    if photo:
        attrs = [
            f'src="{html.escape(asset_href(photo))}"',
            f'alt="{html.escape(f"{name}, anggota kelas TKJ 1 SMKN 1 Lembah Melintang")}"',
        ]
        size = None if REMOTE_RE.match(photo) else image_size(ROOT / photo)
        if size:
            attrs.append(f'width="{size[0]}"')
            attrs.append(f'height="{size[1]}"')
        attrs.append('loading="lazy"')
        attrs.append('decoding="async"')
        out.append('        <div class="member-media">')
        out.append(tag("            ", "img", attrs))
        out.append("        </div>")
    else:
        out.append(f'        <div class="member-media"><div class="avatar">{html.escape(initials(name))}</div></div>')

    # ---- Nama: tautan bila punya instagram ----
    instagram = member.get("instagram")
    if instagram:
        out.append(
            tag(
                "        ",
                "a",
                [
                    'class="member-name"',
                    f'href="{html.escape(instagram)}"',
                    'target="_blank"',
                    'rel="noopener noreferrer"',
                ],
                inner=label,
            )
        )
    else:
        out.append(f'        <span class="member-name">{label}</span>')

    # ---- Pemutar audio mini ----
    audio = member.get("audio")
    out.append('        <div class="member-audio">' if audio else '        <div class="member-audio is-empty">')
    if audio:
        button_attrs = ['class="ma-btn"', 'type="button"', f'aria-label="Putar audio {label}"']
        input_attrs = [
            'class="ma-range"',
            'type="range"',
            'min="0"',
            'max="1000"',
            'step="1"',
            'value="0"',
            f'aria-label="Posisi audio {label}"',
        ]
    else:
        button_attrs = [
            'class="ma-btn"',
            'type="button"',
            f'aria-label="Audio belum tersedia untuk {label}"',
            "disabled",
        ]
        input_attrs = [
            'class="ma-range"',
            'type="range"',
            'min="0"',
            'max="1000"',
            'step="1"',
            'value="0"',
            f'aria-label="Posisi audio {label}"',
            "disabled",
        ]
    out.append(
        tag(
            "            ",
            "button",
            button_attrs,
            inner='<i class="fa-solid fa-play" aria-hidden="true"></i>',
            block_inner=True,
        )
    )
    out.append('            <div class="ma-line">')
    out.append(tag("                ", "input", input_attrs))
    out.append('                <span class="ma-time" aria-hidden="true">--:--</span>')
    out.append("            </div>")
    if audio:
        out.append(
            tag(
                "            ",
                "audio",
                ['preload="metadata"', f'src="{html.escape(asset_href(audio))}"'],
                inner="",
                block_inner=True,
            )
        )
    out.append("        </div>")
    out.append("    </div>")
    return "\n".join(out)


def render_memberlist(members: list[dict]) -> str:
    lines = ['<div class="members-list" id="membersList">']
    lines.extend(render_member(member, number) for number, member in enumerate(members, 1))
    lines.append("</div>")
    return "\n".join(lines)


def validate_members(data) -> list[dict]:
    if not isinstance(data, dict) or not isinstance(data.get("members"), list):
        fail('data/memberlist.json harus berupa objek dengan array "members"')
    members = data["members"]
    if not members:
        fail('data/memberlist.json: "members" masih kosong')

    names = set()
    for number, member in enumerate(members, 1):
        where = f"data/memberlist.json anggota #{number}"
        if not isinstance(member, dict):
            fail(f"{where} bukan objek")

        missing = [key for key in MEMBER_KEYS if key not in member]
        if missing:
            fail(f"{where}: key belum ada -> {', '.join(missing)} (isi \"\" bila tidak dipakai)")
        unknown = sorted(set(member) - set(MEMBER_KEYS))
        if unknown:
            fail(f"{where}: key tidak dikenal -> {', '.join(unknown)} (key yang dipakai: {', '.join(MEMBER_KEYS)})")

        name = member["name"]
        if not isinstance(name, str) or not name.strip():
            fail(f'{where}: "name" wajib diisi')
        if name in names:
            fail(f'{where}: nama "{name}" dobel')
        names.add(name)

        tone = member["tone"]
        if isinstance(tone, bool) or not isinstance(tone, int) or not 0 <= tone <= 360:
            fail(f'{where}: "tone" harus angka bulat 0-360')

        for key in ("photo", "instagram", "audio"):
            value = member[key]
            if not isinstance(value, str):
                fail(f'{where}: "{key}" harus string (kosongkan dengan "")')
            if not value:
                continue
            if key in ("photo", "audio") and not REMOTE_RE.match(value) and not (ROOT / value).is_file():
                fail(f'{where}: berkas "{value}" tidak ditemukan')
            if key == "instagram" and not re.match(r"^https?://", value, re.I):
                fail(f'{where}: "instagram" harus URL http(s), bukan "{value}"')
    return members


def inject_ld(page: str, raw_ld: str) -> str:
    if "</script" in raw_ld.lower():
        fail("data/ld.json memuat '</script', tidak bisa disuntik apa adanya")
    block = "\n".join((LD_INDENT + line) if line.strip() else "" for line in raw_ld.strip().splitlines())
    script_re = re.compile(r'(<script\s+type="application/ld\+json"[^>]*>)(.*?)(</script>)', re.S)
    if not script_re.search(page):
        fail('student/index.html harus punya <script type="application/ld+json"></script> di <head>')
    return script_re.sub(lambda m: f"{m.group(1)}\n{block}\n{LD_INDENT[:-4]}{m.group(3)}", page, count=1)


def inject_members(page: str, block: str) -> str:
    body = "\n".join((PAGE_INDENT + line) if line.strip() else "" for line in block.splitlines())
    start = f"{PAGE_INDENT}<!-- memberlist:start (otomatis dari data/memberlist.json oleh {BUILD_NAME}) -->"
    end = f"{PAGE_INDENT}<!-- memberlist:end -->"
    region = f"{start}\n{body}\n{end}"

    region_re = re.compile(
        r"[ \t]*<!--\s*memberlist:start(?:(?!-->).)*?-->.*?<!--\s*memberlist:end\s*-->", re.S
    )
    if region_re.search(page):
        # Suntikan sebelumnya: cukup ganti isi antara dua penanda.
        return region_re.sub(lambda _: region, page, count=1)

    # Pertama kali: taruh blok tepat setelah komentar penjelas di halaman.
    anchor = page.find(TEMPLATE_NEEDLE)
    if anchor == -1:
        fail(
            "penanda memberlist tidak ditemukan di student/index.html; butuh blok "
            f'<!-- memberlist:start --> … <!-- memberlist:end --> atau komentar "{TEMPLATE_NEEDLE}"'
        )
    close = page.find("-->", anchor)
    if close == -1:
        fail("komentar penanda memberlist di student/index.html tidak ditutup dengan '-->'")
    insert_at = close + 3
    return page[:insert_at] + "\n" + region + page[insert_at:]


def main() -> int:
    try:
        page = PAGE.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"tidak bisa membaca student/index.html: {exc}")
    original = page

    try:
        raw_ld = LD_SOURCE.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"tidak bisa membaca data/ld.json: {exc}")
    try:
        json.loads(raw_ld)
    except json.JSONDecodeError as exc:
        fail(f"data/ld.json tidak valid: {exc}")

    members = validate_members(read_json(MEMBERS_SOURCE))

    page = inject_ld(page, raw_ld)
    page = inject_members(page, render_memberlist(members))

    if page == original:
        print("student/index.html sudah sinkron dengan data/, tidak ada perubahan")
        return 0

    try:
        PAGE.write_text(page, encoding="utf-8")
    except OSError as exc:
        fail(f"tidak bisa menulis student/index.html: {exc}")
    print(
        f"student/index.html diperbarui: {len(members)} anggota dari data/memberlist.json "
        "+ JSON-LD dari data/ld.json"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
