import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";
import "./style.css";
const MOBILE = Capacitor.isNativePlatform();
const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
type Hero = {
  name: string;
  classId: string;
  level: number;
  exp: number;
  gold: number;
  diamond: number;
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  atk: number;
  def: number;
  crit: number;
  dailyClaimed?: boolean;
  petId?: string;
  offlineSeconds?: number;
  inventory?: LootItem[];
  equipped?: Record<string,string>;
  questKills?: number[];
  npcQuestDone?: number[];
};
type LootItem = {id:string;name:string;slot:"weapon"|"armor"|"head"|"accessory";icon:number;source:"drop"|"class"|"npc"|"boss-mid"|"boss-high";allowedClass?:string;atk?:number;def?:number;bonusPercent?:number;tier?:string};
const CLASSES = [
  ["wukong", "Ngộ Không", "Cận chiến • chí mạng • biến hóa", "⚔"],
  ["bajie", "Bát Giới", "Đỡ đòn • khống chế • hồi phục", "♜"],
  ["wujing", "Sa Tăng", "Cân bằng • bảo hộ • phản đòn", "⛨"],
  ["tang", "Đường Tăng", "Pháp thuật • trị liệu • tầm xa", "✦"],
];
const MAPS = [
  ["Rừng Sơ Khai", 1, "Mộc Linh", "Công Kê Họa Sư"],
  ["Thôn Trư Gia", 4, "Trư Yêu Con", "Trư Bá Bá"],
  ["Hang Bóng Tối", 7, "Dơi Tử Ảnh", "Tam Tạng Thiền Sư"],
  ["Đầm Nấm Độc", 10, "Nấm Độc Nhãn", "Liên Hoa Đồng Tử"],
  ["Sa Mạc Xích Phong", 14, "Hỏa Hồ", "Huyền Hồ Đạo Trưởng"],
  ["Trúc Lâm Mê Vụ", 18, "Trúc Quỷ Cung", "Bạch Vân Tiên Ông"],
  ["Băng Nguyên Vĩnh Dạ", 22, "Sói Băng", "Phán Quan U Minh"],
  ["Lôi Sơn Cổ Đạo", 27, "Lôi Giáp Trùng", "Bạch Y Kiếm Khách"],
  ["Huyết Nguyệt Ma Thành", 33, "Huyết Dực Yêu", "Công Kê Họa Sư"],
  ["Thiên Môn Yên Lãng", 40, "Lam Quỷ Vương", "Bạch Vân Tiên Ông"],
  ["Hoa Quả Sơn Ngoại Vi", 46, "Thạch Hầu Hoang", "Lão Hầu Trưởng"],
  ["Bạch Cốt Lĩnh", 52, "Bạch Cốt Binh", "Sơn Thần Bạch Lĩnh"],
  ["Hắc Thủy Hà", 58, "Thủy Xà Yêu", "Long Nữ Hắc Hà"],
  ["Hỏa Vân Động", 65, "Hỏa Đồng Tử", "Thổ Địa Hỏa Vân"],
  ["Nữ Nhi Quốc", 72, "Độc Tỳ Yêu", "Nữ Quan Hộ Thành"],
  ["Sư Đà Lĩnh", 80, "Sư Thứu Yêu", "Tiều Phu Lạc Lối"],
  ["Kim Đâu Động", 89, "Kim Giáp Ngưu", "Thái Thượng Đồng Tử"],
  ["Hắc Phong Sơn", 98, "Hắc Hùng Tinh", "Thiền Sư Quan Âm"],
  ["Lôi Âm Cổ Tự", 108, "Ma Tăng Hộ Pháp", "Kim Cang La Hán"],
  ["Linh Sơn Thánh Cảnh", 120, "Thiên Ma Vương", "Phật Tổ Tiếp Dẫn"],
];
const LOOT_TEMPLATES: Omit<LootItem,"id">[] = [
  {name:"Ngọc Thiềm Bội",slot:"accessory",icon:0,source:"drop",def:2},
  {name:"Đào Tiên Hộ Mệnh",slot:"accessory",icon:1,source:"drop",def:2},
  {name:"Nhẫn Đồng Yêu Văn",slot:"accessory",icon:2,source:"drop",atk:2},
  {name:"Vân Châu Liên",slot:"accessory",icon:3,source:"drop",atk:1,def:1},
  {name:"Kim Cô Bổng",slot:"weapon",icon:4,source:"class",allowedClass:"wukong",atk:7},
  {name:"Cửu Xỉ Đinh Ba",slot:"weapon",icon:5,source:"class",allowedClass:"bajie",atk:6,def:2},
  {name:"Hàng Yêu Bảo Trượng",slot:"weapon",icon:6,source:"class",allowedClass:"wujing",atk:6,def:1},
  {name:"Cà Sa Chân Kinh",slot:"armor",icon:7,source:"class",allowedClass:"tang",def:6},
  {name:"Diệp Giáp Ếch Tinh",slot:"armor",icon:8,source:"npc",def:5},
  {name:"Liên Hoa Cà Sa",slot:"armor",icon:9,source:"npc",def:5,atk:1},
  {name:"Viên Hầu Khăn Vai",slot:"accessory",icon:10,source:"npc",atk:3,def:2},
  {name:"Vũ Quan Hành Cước",slot:"head",icon:11,source:"npc",atk:2,def:4},
];
const makeLoot=(index:number):LootItem=>({...LOOT_TEMPLATES[index],id:`loot-${Date.now()}-${Math.random().toString(36).slice(2,8)}`});
const CLASS_LOOT_INDEX: Record<string,number>={wukong:4,bajie:5,wujing:6,tang:7};
const rollPercent=(min:number,max:number)=>Phaser.Math.Between(min,max);
const makeScaledLoot=(classId:string,tier:"npc"|"drop"|"boss-mid"|"boss-high"):LootItem=>{
  const ranges={npc:[1,3],drop:[4,7],"boss-mid":[8,11],"boss-high":[12,15]} as const;
  const labels={npc:"NPC",drop:"Quái", "boss-mid":"Boss tầm trung", "boss-high":"Boss cao cấp"};
  const [min,max]=ranges[tier];
  const pct=rollPercent(min,max);
  const item=makeLoot(CLASS_LOOT_INDEX[classId]??CLASS_LOOT_INDEX.wukong);
  item.source=tier;item.allowedClass=classId;item.bonusPercent=pct;item.tier=labels[tier];
  item.atk=Math.max(1,Math.round((item.atk||2)*(1+pct/10)));
  item.def=Math.max(0,Math.round((item.def||1)*(1+pct/12)));
  if(tier==="boss-mid"||tier==="boss-high") item.name=`${tier==="boss-high"?'Thánh':'Vương'} • ${item.name}`;
  return item;
};
const makeClassLoot=(classId:string):LootItem=>makeScaledLoot(classId,"drop");
type SkillDef = { name: string; mp: number; power: number; cd: number; level: number };
const SKILL_NAMES: Record<string, string[]> = {
  wukong: ["Gậy Như Ý","Cân Đẩu Vân","Thất Thập Nhị Biến","Hỏa Nhãn Kim Tinh","Phân Thân Hầu Vương","Định Thân Thuật","Đại Náo Thiên Cung","Kim Cang Bất Hoại","Như Ý Liên Kích","Tề Thiên Thịnh Nộ"],
  bajie: ["Cửu Xỉ Đinh Ba","Quét Ngàn Cân","Da Dày Thịt Béo","Nuốt Chửng","Lăn Địa Chấn","Hơi Thở Cuồng Phong","Trư Vương Hộ Thể","Đinh Ba Trấn Địa","No Bụng Hồi Sinh","Thiên Bồng Giáng Thế"],
  wujing: ["Hàng Yêu Bảo Trượng","Lưu Sa Kích","Sa Hà Hộ Giáp","Gánh Hành Lý","Trượng Ảnh Liên Hoàn","Cát Lún Trói Chân","Tĩnh Tâm Phản Đòn","Sa Bạo Hộ Chủ","Lưu Sa Vạn Trượng","Kim Thân La Hán"],
  tang: ["Tụng Kinh","Phật Quang","Tịnh Tâm Chú","Kim Thiền Thoát Xác","Cà Sa Hộ Mệnh","Liên Hoa Trị Liệu","Chân Kinh Trấn Yêu","Vạn Phật Triều Tông","Đại Bi Chú","Phật Pháp Vô Biên"],
};
// Tuned for continuous mobile combat: early skills can be woven between
// normal attacks while the strongest skills still need a short recovery.
const SKILL_MP=[3,4,5,7,9,11,13,16,19,22];
const SKILL_POWER=[1.2,1.45,1.7,2,2.35,2.7,3.1,3.6,4.2,5];
const SKILL_CD=[2,2,3,4,5,6,7,8,10,12];
const SKILLS: Record<string, SkillDef[]> = Object.fromEntries(Object.entries(SKILL_NAMES).map(([id,names]) => [id, names.map((name,i) => ({name,mp:SKILL_MP[i],power:SKILL_POWER[i],cd:SKILL_CD[i],level:[1,3,5,8,11,14,17,20,24,30][i]}))]));
const classIndex = (id: string) => CLASSES.findIndex(c => c[0] === id);
const skillIcon = (classId: string, i: number) => `style="--sx:${i};--sy:${classIndex(classId)}"`;

function createClassCharacter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  classId: string,
) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  const colors: Record<string, [number, number, number]> = {
    wukong: [0xd6a52f, 0x44281c, 0xffd35a],
    bajie: [0x3c826f, 0x3b261f, 0xd6b071],
    wujing: [0x61738d, 0x302b28, 0xd0aa65],
    tang: [0xb44736, 0x463023, 0xffd76b],
  };
  const [main, dark, accent] = colors[classId] || colors.wukong;

  // Shadow, boots, body and head form a readable chibi silhouette on mobile.
  g.fillStyle(0x000000, 0.28).fillEllipse(0, 38, 76, 18);
  g.fillStyle(dark).fillRoundedRect(-27, 18, 22, 26, 7).fillRoundedRect(5, 18, 22, 26, 7);
  g.fillStyle(main).fillRoundedRect(-31, -18, 62, 55, 15);
  g.fillStyle(0xf2bd88).fillCircle(0, -39, 27);
  g.fillStyle(0xffffff).fillCircle(-9, -42, 5).fillCircle(9, -42, 5);
  g.fillStyle(0x192033).fillCircle(-8, -41, 2.5).fillCircle(10, -41, 2.5);

  if (classId === "tang") {
    g.fillStyle(dark).fillTriangle(-42, -55, 42, -55, 4, -105).fillRect(-27, -69, 54, 16);
    g.lineStyle(7, 0x75452b).lineBetween(38, -12, 50, 47);
    g.fillStyle(accent).fillCircle(36, -28, 13).lineStyle(3, 0xf1caff).strokeCircle(36, -28, 13);
  } else if (classId === "bajie") {
    g.fillStyle(dark).fillEllipse(0, -61, 62, 25).fillRect(-28, -66, 56, 13);
    g.fillStyle(0xffffff).fillCircle(0, -62, 7).fillTriangle(-12, -57, 12, -57, 0, -72);
    g.lineStyle(6, 0x4b3324).lineBetween(35, -4, 57, -28);
    g.fillStyle(0x9aa7b7).fillRoundedRect(47, -35, 27, 12, 3);
  } else if (classId === "wujing") {
    g.fillStyle(0xe9eef8).fillRoundedRect(-20, -69, 40, 18, 8);
    g.lineStyle(6, 0xb2824d).lineBetween(38, -18, 50, 43);
    g.fillStyle(accent).fillCircle(35, -34, 14).lineStyle(3, 0xffffff).strokeCircle(35, -34, 14);
  } else if (classId === "wukong") {
    g.fillStyle(0xaec0d4).fillRoundedRect(-28, -65, 56, 22, 8);
    g.lineStyle(8, 0x6d472c).lineBetween(31, 15, 55, -28);
    g.lineStyle(7, 0xe8edf5).lineBetween(52, -24, 73, -64);
    g.lineStyle(4, accent).lineBetween(44, -31, 62, -20);
  } else if (classId === "hero") {
    g.fillStyle(accent).fillRect(-31, -20, 62, 13);
    g.fillStyle(0xd8b44b).fillTriangle(-19, -64, 0, -82, 19, -64);
    g.fillStyle(0xe8edf5).fillCircle(-42, 3, 25).lineStyle(5, accent).strokeCircle(-42, 3, 22);
    g.fillStyle(accent).fillRect(-47, -10, 10, 26).fillRect(-55, -2, 26, 10);
  } else if (classId === "demon") {
    g.fillStyle(dark).fillTriangle(-23, -59, -44, -91, -7, -70).fillTriangle(23, -59, 44, -91, 7, -70);
    g.fillStyle(accent).fillCircle(-9, -42, 3).fillCircle(9, -42, 3);
    g.lineStyle(7, 0x3b2630).lineBetween(37, -5, 65, -48);
    g.fillStyle(accent).fillTriangle(55, -43, 77, -64, 68, -36);
  } else if (classId === "assassin") {
    g.fillStyle(dark).fillRoundedRect(-29, -68, 58, 30, 12);
    g.fillStyle(accent).fillRect(-18, -47, 36, 4);
    g.lineStyle(7, 0x667187).lineBetween(-29, 12, -60, -38).lineBetween(29, 12, 60, -38);
    g.lineStyle(4, accent).lineBetween(-55, -34, -69, -55).lineBetween(55, -34, 69, -55);
  }
  root.add(g);
  root.setSize(130, 150);
  scene.tweens.add({ targets: root, y: y - 5, duration: 720, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  return root;
}
const app = document.querySelector("#app")!;
let token = localStorage.getItem("fq-token");
let hero: Hero | null = null;
let game: Phaser.Game | null = null;
type LocalAccount = {
  username: string;
  email: string;
  passwordHash: string;
  hero: Hero;
  lastSeen: number;
};
const accountKey = (name: string) => `fq-account:${name.toLowerCase()}`;
async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
function currentAccount() {
  if (!token) return null;
  const raw = localStorage.getItem(accountKey(token));
  return raw ? (JSON.parse(raw) as LocalAccount) : null;
}
function saveAccount(a: LocalAccount) {
  a.lastSeen = Date.now();
  localStorage.setItem(accountKey(a.username), JSON.stringify(a));
  localStorage.setItem(
    `fq-email:${a.email.toLowerCase()}`,
    a.username.toLowerCase(),
  );
}
function persistLocalHero() {
  if (!MOBILE || !hero) return;
  const a = currentAccount();
  if (a) {
    a.hero = hero;
    saveAccount(a);
  }
}
async function localReq(path: string, opts: any = {}) {
  const body = opts.body ? JSON.parse(opts.body) : {};
  if (path === "/auth/register") {
    if (
      !body.username ||
      !body.email ||
      !body.characterName ||
      String(body.password || "").length < 8
    )
      throw Error("Thông tin chưa hợp lệ; mật khẩu tối thiểu 8 ký tự");
    if (
      localStorage.getItem(accountKey(body.username)) ||
      localStorage.getItem(`fq-email:${body.email.toLowerCase()}`)
    )
      throw Error("Username hoặc email đã tồn tại");
    const a: LocalAccount = {
      username: body.username.toLowerCase(),
      email: body.email,
      passwordHash: await hash(body.password),
      lastSeen: Date.now(),
      hero: {
        name: body.characterName,
        classId: "",
        level: 1,
        exp: 0,
        gold: 200,
        diamond: 10,
        hp: 100,
        maxHp: 100,
        atk: 14,
        def: 5,
        crit: 0.1,
        dailyClaimed: false,
        offlineSeconds: 0,
      },
    };
    saveAccount(a);
    return { token: a.username, character: a.hero };
  }
  if (path === "/auth/login") {
    const id = String(body.identity || "").toLowerCase();
    const username = localStorage.getItem(`fq-email:${id}`) || id;
    const raw = localStorage.getItem(accountKey(username));
    if (!raw) throw Error("Sai tài khoản hoặc mật khẩu");
    const a = JSON.parse(raw) as LocalAccount;
    if (a.passwordHash !== (await hash(body.password || "")))
      throw Error("Sai tài khoản hoặc mật khẩu");
    a.hero.offlineSeconds = Math.min(
      28800,
      Math.max(0, Math.floor((Date.now() - a.lastSeen) / 1000)),
    );
    saveAccount(a);
    return { token: a.username, character: a.hero };
  }
  const a = currentAccount();
  if (!a) throw Error("Phiên đăng nhập đã hết hạn");
  if (path === "/character") return a.hero;
  if (path === "/character/class") {
    a.hero.classId = body.classId;
    saveAccount(a);
    return a.hero;
  }
  if (path === "/daily/claim") {
    const today = new Date().toISOString().slice(0, 10),
      key = `fq-daily:${a.username}`;
    if (localStorage.getItem(key) === today) throw Error("Hôm nay đã nhận rồi");
    a.hero.diamond += 5;
    a.hero.dailyClaimed = true;
    localStorage.setItem(key, today);
    saveAccount(a);
    return a.hero;
  }
  if (path === "/pet/adopt") {
    const prices: any = { slime: 150, fox: 350, dragon: 800 },
      price = prices[body.petId];
    if (!price) throw Error("Pet không hợp lệ");
    if (a.hero.gold < price) throw Error("Không đủ vàng");
    a.hero.gold -= price;
    a.hero.petId = body.petId;
    saveAccount(a);
    return a.hero;
  }
  if (path === "/offline/claim") {
    const seconds = Number(a.hero.offlineSeconds || 0);
    if (!a.hero.petId || seconds < 60)
      throw Error("Cần pet và ít nhất 1 phút offline");
    const rate = ({ slime: 1, fox: 2, dragon: 4 } as any)[a.hero.petId],
      gold = Math.floor(seconds / 60) * rate,
      exp = Math.floor(seconds / 60) * rate * 2;
    a.hero.gold += gold;
    a.hero.exp += exp;
    a.hero.offlineSeconds = 0;
    saveAccount(a);
    return { gold, exp, character: a.hero };
  }
  throw Error("Tính năng chưa hỗ trợ");
}
async function req(path: string, opts: any = {}) {
  if (MOBILE) return localReq(path, opts);
  const r = await fetch(API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error || "Có lỗi xảy ra");
  return j;
}
type RegisterDraft = { username: string; email: string; password: string };
function landing() {
  const email = localStorage.getItem("fq-last-email") || "tài khoản đã lưu";
  const canContinue = Boolean(token);
  app.innerHTML = `<main class="login-scene landing-scene"><section class="welcome-card landing-menu"><div class="login-title"><div class="login-emblem">山</div><div><div class="brand">FARM QUÁI</div><p class="sub">Tiểu Yêu Núi Yên Lãng</p></div></div><div class="entry-menu"><button class="entry continue" ${canContinue ? "" : "disabled"}><i>▶</i><span><small>TIẾP TỤC VỚI TÀI KHOẢN</small><b>${canContinue ? email : "Chưa có tài khoản đăng nhập"}</b></span></button><button class="entry new-game"><i>＋</i><span><small>KHỞI ĐẦU HÀNH TRÌNH</small><b>Chơi mới</b></span></button><button class="entry account"><i>♙</i><span><small>TÀI KHOẢN</small><b>Đăng nhập / Đăng ký</b></span></button></div><p class="save-note">☁ Tiến trình được lưu theo tài khoản của bạn</p></section></main>`;
  app.querySelector(".continue")?.addEventListener("click", continueGame);
  app.querySelector(".new-game")!.addEventListener("click", () => choose(undefined, true));
  app.querySelector(".account")!.addEventListener("click", () => auth());
}
async function continueGame() {
  try {
    hero = await req("/character");
    classIndex(hero?.classId || "") >= 0 ? play() : choose();
  } catch (x: any) {
    localStorage.removeItem("fq-token"); token = null;
    auth("login", undefined, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.");
  }
}
function auth(initialMode = "login", newHero?: { name: string; classId: string }, notice = "") {
  app.innerHTML = `<main class="login-scene"><section class="auth card"><button class="back-login">←</button><div class="brand">TÀI KHOẢN</div><p class="sub">Bảo vệ hành trình của tiểu yêu</p><div class="tabs"><button data-mode="login">Đăng nhập</button><button data-mode="register">Đăng ký</button></div><form><label class="field"><span class="identity-label">Tài khoản / Email</span><input name="identity" autocomplete="username" required></label><label class="field email"><span>Email</span><input name="email" type="email" autocomplete="email"></label><label class="field"><span>Mật khẩu</span><input name="password" type="password" minlength="8" autocomplete="current-password" required></label><label class="field confirm"><span>Nhập lại mật khẩu</span><input name="confirmPassword" type="password" minlength="8"></label><div class="error">${notice}</div><div class="auth-actions"><button type="submit" class="primary confirm-auth">XÁC NHẬN</button><button type="button" class="forgot">Quên mật khẩu?</button></div></form><form class="recovery" hidden><h3>Khôi phục mật khẩu</h3><p class="sub">Nhập email đã đăng ký để nhận hướng dẫn khôi phục.</p><label class="field"><span>Email</span><input name="recoveryEmail" type="email" required></label><div class="error"></div><button class="primary">GỬI YÊU CẦU</button><button type="button" class="cancel-recovery">Quay lại</button></form></section></main>`;
  let mode = initialMode;
  const setMode = (next: string) => {
    mode = next;
    app.querySelectorAll("[data-mode]").forEach(x => x.classList.toggle("on", (x as HTMLElement).dataset.mode === mode));
    app.querySelectorAll(".email,.confirm").forEach(x => ((x as HTMLElement).hidden = mode === "login"));
    (app.querySelector(".identity-label") as HTMLElement).textContent = mode === "login" ? "Tài khoản / Email" : "Tên tài khoản";
  };
  setMode(mode);
  app.querySelector(".back-login")!.addEventListener("click", landing);
  app.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => setMode((b as HTMLElement).dataset.mode!)));
  app.querySelector(".forgot")!.addEventListener("click", () => { (app.querySelector(".auth form:not(.recovery)") as HTMLElement).hidden=true; (app.querySelector(".recovery") as HTMLElement).hidden=false; });
  app.querySelector(".cancel-recovery")!.addEventListener("click", () => { (app.querySelector(".auth form:not(.recovery)") as HTMLElement).hidden=false; (app.querySelector(".recovery") as HTMLElement).hidden=true; });
  app.querySelector(".recovery")!.addEventListener("submit", (e) => { e.preventDefault(); const box=(e.currentTarget as HTMLElement).querySelector(".error")!; box.textContent="Nếu email tồn tại, hướng dẫn khôi phục đã được gửi."; });
  app.querySelector(".auth form:not(.recovery)")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string,string>;
    const error = app.querySelector(".auth form:not(.recovery) .error")!;
    if (mode === "register") {
      if (d.password !== d.confirmPassword) { error.textContent="Hai mật khẩu chưa trùng nhau"; return; }
      const draft={username:d.identity,email:d.email,password:d.password};
      if (newHero) return finishRegistration(draft,newHero,error);
      choose(draft, true); return;
    }
    try {
      const x=await req("/auth/login",{method:"POST",body:JSON.stringify({identity:d.identity,password:d.password})});
      token=x.token; hero=x.character;
      localStorage.setItem("fq-token",token!);
      localStorage.setItem("fq-last-email", String(d.identity));
      landing();
    } catch(x:any) { error.textContent=x.message; }
  });
}
async function finishRegistration(draft:RegisterDraft,newHero:{name:string;classId:string},error:Element) {
  try {
    const x=await req("/auth/register",{method:"POST",body:JSON.stringify({...draft,characterName:newHero.name})});
    token=x.token; hero=x.character;
    localStorage.setItem("fq-token",token!); localStorage.setItem("fq-last-email",draft.email);
    hero=await req("/character/class",{method:"POST",body:JSON.stringify({classId:newHero.classId})});
    landing();
  } catch(x:any) { error.textContent=x.message; }
}
function choose(registerDraft?: RegisterDraft, requireName = false) {
  app.innerHTML = `<main class="shell choose-shell"><button class="choose-back">← Quay lại</button><div class="brand">TIỂU YÊU NÚI YÊN LÃNG</div><p class="sub">Chọn lữ khách • xem rõ vai trò và đủ 10 tuyệt kỹ</p>${requireName ? `<label class="hero-name field"><span>Tên nhân vật</span><input maxlength="18" placeholder="Nhập tên tiểu yêu..." required></label>` : ""}<section class="classes">${CLASSES.map((c,i) => `<button class="class" data-id="${c[0]}"><span class="spirit-art" style="--class:${i}"></span><span class="class-copy"><b>${c[1]}</b><small>${c[2]}</small><em>10 KỸ NĂNG</em></span></button>`).join("")}</section><section class="class-detail card"><div class="detail-portrait spirit-art"></div><div><p class="detail-role"></p><h2 class="detail-name">Hãy chọn một nhân vật</h2><p class="detail-desc">Thông tin chi tiết và toàn bộ kỹ năng sẽ hiện tại đây.</p><div class="detail-skills"></div><div class="error"></div><button class="primary confirm-class" disabled>CHỌN NHÂN VẬT NÀY</button></div></section></main>`;
  let picked = "";
  app.querySelectorAll(".class").forEach((b) => b.addEventListener("click", () => {
    picked = (b as HTMLElement).dataset.id!;
    const i = classIndex(picked), c = CLASSES[i];
    app.querySelectorAll(".class").forEach(x=>x.classList.toggle("selected",x===b));
    (app.querySelector(".detail-portrait") as HTMLElement).style.setProperty("--class",String(i));
    (app.querySelector(".detail-portrait") as HTMLElement).dataset.hero=picked;
    app.querySelector(".detail-name")!.textContent=c[1];
    app.querySelector(".detail-role")!.textContent=c[2];
    app.querySelector(".detail-desc")!.textContent=`${c[1]} có lối đánh ${c[2].toLowerCase()}, hiệu ứng riêng và chuyển động dễ đọc trên màn hình nhỏ.`;
    app.querySelector(".detail-skills")!.innerHTML=SKILLS[picked].map((s,n)=>`<span><b>${n+1}. ${s.name}</b><small>Lv.${s.level} • ${s.mp} MP • x${s.power.toFixed(1)}</small></span>`).join("");
    (app.querySelector(".confirm-class") as HTMLButtonElement).disabled=false;
  }));
  app.querySelector(".choose-back")!.addEventListener("click", landing);
  app.querySelector(".confirm-class")!.addEventListener("click",async()=>{
    if(!picked)return;
    if(requireName){
      const name=(app.querySelector(".hero-name input") as HTMLInputElement).value.trim();
      if(name.length<2){app.querySelector(".class-detail .error")!.textContent="Tên nhân vật cần ít nhất 2 ký tự";return;}
      const draftHero={name,classId:picked};
      if(registerDraft){const fake=document.createElement("div");await finishRegistration(registerDraft,draftHero,fake);if(fake.textContent) app.querySelector(".class-detail .error")!.textContent=fake.textContent;}
      else auth("register",draftHero,"Hãy đăng ký để lưu nhân vật vừa tạo.");
      return;
    }
    hero=await req("/character/class",{method:"POST",body:JSON.stringify({classId:picked})});play();
  });
}
function play() {
  if (!hero) return;
  if (classIndex(hero.classId) < 0) { choose(); return; }
  hero.maxMp ??= 100;
  hero.mp ??= hero.maxMp;
  hero.inventory ??=[]; hero.equipped ??={}; hero.questKills ??=[]; hero.npcQuestDone ??=[];
  while(hero.questKills.length<MAPS.length) hero.questKills.push(0);
  app.innerHTML = `<main class="shell game-shell"><div class="topline"><div class="brand">FARM QUÁI</div><div class="top-actions"><button class="icon-btn skills-btn">✦ Kỹ năng</button><button class="icon-btn inventory-btn">🎒<span>Hành trang</span></button><button class="icon-btn chat-btn">💬 Chat</button><button class="icon-btn logout">↪</button></div></div><div class="hud"></div><div class="game-layout"><section class="battle-wrap"><div id="game"></div><div class="monster-status empty"><span class="monster-icon">?</span><span><b>CHƯA CHỌN QUÁI</b><small>Chạm vào quái để xem trạng thái</small><i><em></em></i></span></div><button class="map-gate map-back" hidden>◀ BACK</button><button class="map-gate map-next" hidden>NEXT ▶</button><div class="mobile-controls"><div class="move-pad"><button class="move-left">◀</button><button class="move-right">▶</button></div><div class="combat-skills"></div><div class="action-orbs"><button class="power-btn">✦<span>KHÍ</span></button><div class="attack-stack"><button class="target-btn">◎<span>ĐỔI MỤC TIÊU</span></button><button class="attack-btn">⚔<span>ĐÁNH</span></button></div></div></div><div class="map-select"></div></section><aside class="side card"><h3>${CLASSES.find((c) => c[0] === hero!.classId)?.[1]}</h3><h3>Nhiệm vụ ngày</h3><button class="skill daily" ${hero.dailyClaimed ? "disabled" : ""}>🎁 ${hero.dailyClaimed ? "Đã nhận hôm nay" : "Nhận 5 kim cương"}</button><h3>Pet auto-farm</h3><div class="pets"></div><button class="skill offline" ${!hero.petId || Number(hero.offlineSeconds) < 60 ? "disabled" : ""}>💤 Quà offline (${Math.floor(Number(hero.offlineSeconds || 0) / 60)} phút)</button><h3>Chiến lợi phẩm</h3><div class="feed"></div></aside></div><dialog class="skill-modal"><button class="close">✕</button><h2>✦ Sách kỹ năng</h2><p class="skill-tip">Mỗi class có 10 kỹ năng. Kỹ năng mới mở theo cấp độ.</p><div class="skill-book"></div></dialog><dialog class="inventory-modal"><button class="close">✕</button><h2>🎒 Hành trang</h2><p class="inventory-rule">Mọi đồ rơi khóa đúng class • Chỉ số 1–15% • Boss cao cấp > tầm trung > quái > NPC</p><div class="equipment"></div><h3>Vật phẩm</h3><div class="bag-grid loot-grid"></div></dialog><dialog class="chat-modal"><button class="close">✕</button><h2>💬 Chat thế giới</h2><div class="chat-log"><p><b>[Hệ thống]</b> Chào mừng đến Farm Quái!</p></div><form class="chat-form"><input maxlength="80" placeholder="Nhập tin nhắn..."><button>Gửi</button></form></dialog></main>`;
  const oldPad = document.querySelector(".move-pad") as HTMLElement;
  oldPad.className = "moba-stick";
  oldPad.innerHTML = "<i></i>";
  const inventory = document.querySelector(".inventory-modal") as HTMLDialogElement;
  const chat = document.querySelector(".chat-modal") as HTMLDialogElement;
  const skillModal = document.querySelector(".skill-modal") as HTMLDialogElement;
  const iconStyle=(icon:number)=>`style="--ix:${icon%4};--iy:${Math.floor(icon/4)}"`;
  const renderInventory=()=>{
    const slots:[[string,string],[string,string],[string,string],[string,string]]=[["weapon","Vũ khí"],["head","Mũ"],["armor","Giáp"],["accessory","Phụ kiện"]];
    document.querySelector(".equipment")!.innerHTML=slots.map(([slot,label])=>{const item=hero!.inventory!.find(x=>x.id===hero!.equipped![slot]);return `<div class="equip-slot">${item?`<i class="loot-icon" ${iconStyle(item.icon)}></i><b>${item.name}</b><button data-unequip="${slot}">Tháo</button>`:`<span>＋</span><small>${label}</small>`}</div>`}).join("");
    document.querySelector(".loot-grid")!.innerHTML=hero!.inventory!.length?hero!.inventory!.map(item=>{const locked=item.allowedClass&&item.allowedClass!==hero!.classId;const worn=hero!.equipped![item.slot]===item.id;const className=CLASSES.find(c=>c[0]===item.allowedClass)?.[1]||"class hiện tại";const rule=`${item.tier||"Trang bị"}${item.bonusPercent?` +${item.bonusPercent}%`:""} • Chỉ ${className}`;return `<div class="loot-card ${locked?'locked':''}"><i class="loot-icon" ${iconStyle(item.icon)}></i><b>${item.name}</b><small>${rule} • ${item.atk?`+${item.atk} ATK `:""}${item.def?`+${item.def} DEF`:""}</small><button data-equip="${item.id}" ${locked||worn?'disabled':''}>${worn?'Đang mặc':locked?'Sai class':'Mặc'}</button></div>`}).join(""):'<p class="empty-bag">Chưa có trang bị — đi săn quái thôi bro 👀</p>';
    document.querySelectorAll("[data-equip]").forEach(node=>node.addEventListener("click",()=>{const item=hero!.inventory!.find(x=>x.id===(node as HTMLElement).dataset.equip)!;if(item.allowedClass&&item.allowedClass!==hero!.classId){alert("Trang bị này chỉ dành cho đúng class của nó.");return;}const old=hero!.inventory!.find(x=>x.id===hero!.equipped![item.slot]);if(old){hero!.atk-=old.atk||0;hero!.def-=old.def||0;}hero!.equipped![item.slot]=item.id;hero!.atk+=item.atk||0;hero!.def+=item.def||0;persistLocalHero();renderInventory();}));
    document.querySelectorAll("[data-unequip]").forEach(node=>node.addEventListener("click",()=>{const slot=(node as HTMLElement).dataset.unequip!;const old=hero!.inventory!.find(x=>x.id===hero!.equipped![slot]);if(old){hero!.atk-=old.atk||0;hero!.def-=old.def||0;}delete hero!.equipped![slot];persistLocalHero();renderInventory();}));
  };
  renderInventory();
  document.querySelector(".skills-btn")!.addEventListener("click", () => skillModal.showModal());
  document.querySelector(".inventory-btn")!.addEventListener("click", () => {renderInventory();inventory.showModal();});
  document.querySelector(".chat-btn")!.addEventListener("click", () => chat.showModal());
  document.querySelectorAll("dialog .close").forEach((b) => b.addEventListener("click", () => (b.closest("dialog") as HTMLDialogElement).close()));
  document.querySelector(".chat-form")!.addEventListener("submit", (e) => {e.preventDefault();const input=document.querySelector(".chat-form input") as HTMLInputElement;if(!input.value.trim())return;document.querySelector(".chat-log")!.insertAdjacentHTML("beforeend",`<p><b>${hero!.name}:</b> ${input.value.replace(/[<>]/g, "")}</p>`);input.value="";});
  document.querySelector(".logout")!.addEventListener("click", () => {
    game?.destroy(true);
    game = null;
    landing();
  });
  const pets: any = {
    slime: "Slime 150🪙",
    fox: "Cáo 350🪙",
    dragon: "Rồng 800🪙",
  };
  document.querySelector(".pets")!.innerHTML = Object.entries(pets)
    .map(
      ([id, n]) =>
        `<button class="skill pet" data-id="${id}" ${hero!.petId === id ? "disabled" : ""}>${hero!.petId === id ? "✅ " : ""}${n}</button>`,
    )
    .join("");
  document.querySelector(".daily")!.addEventListener("click", async () => {
    hero = await req("/daily/claim", { method: "POST" });
    play();
  });
  document.querySelectorAll(".pet").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        hero = await req("/pet/adopt", {
          method: "POST",
          body: JSON.stringify({ petId: (b as HTMLElement).dataset.id }),
        });
        play();
      } catch (e: any) {
        alert(e.message);
      }
    }),
  );
  document.querySelector(".offline")!.addEventListener("click", async () => {
    try {
      const x = await req("/offline/claim", { method: "POST" });
      hero = x.character;
      alert(`Pet farm được ${x.gold} vàng và ${x.exp} EXP!`);
      play();
    } catch (e: any) {
      alert(e.message);
    }
  });
  startGame();
}
function startGame() {
  const VIEW_WIDTH = 900, WORLD_WIDTH = 1800, MELEE_RANGE = 155;
  let map = 0,
    enemies: any[] = [], selectedEnemy: any, npcSelected=false;
  const logs: string[] = [];
  const scene = {
        preload(this: Phaser.Scene) {
      this.load.image("spirits", "/assets/mountain-spirits-atlas.png");
      this.load.image("hero-wukong", "/assets/heroes/wukong-yen-lang.png");
      this.load.image("hero-bajie", "/assets/heroes/bajie-yen-lang.png");
      this.load.image("hero-wujing", "/assets/heroes/wujing-v2.png");
      this.load.image("hero-tang", "/assets/heroes/tang-v2.png");
      // Load hero idle-v2 variants (geared/plain)
      this.load.image("idle-wukong-plain", "/assets/heroes/idle-v2/wukong-plain.png");
      this.load.image("idle-wukong-geared", "/assets/heroes/idle-v2/wukong-geared.png");
      this.load.image("idle-bajie-plain", "/assets/heroes/idle-v2/bajie-plain.png");
      this.load.image("idle-bajie-geared", "/assets/heroes/idle-v2/bajie-geared.png");
      this.load.image("idle-wujing-plain", "/assets/heroes/idle-v2/wujing-plain.png");
      this.load.image("idle-wujing-geared", "/assets/heroes/idle-v2/wujing-geared.png");
      this.load.image("idle-tang-plain", "/assets/heroes/idle-v2/tang-plain.png");
      this.load.image("idle-tang-geared", "/assets/heroes/idle-v2/tang-geared.png");
      // Load individual monster frames (8 monsters)
      for(let frame=0; frame<8; frame++){
        this.load.image(`monster-${frame}`, `/assets/monsters/individual/monster-${frame}.png`);
      }
      // Load classic monsters
      for(let frame=0; frame<10; frame++){
        this.load.image(`classic-${frame}`, `/assets/monsters/classic/classic-${frame}.png`);
      }
      // Load extra monsters
      for(let frame=0; frame<10; frame++){
        this.load.image(`extra-${frame}`, `/assets/monsters/extra/extra-${frame}.png`);
      }
      // Load jester monsters atlas
      this.load.image("jester-monsters", "/assets/monsters/jester-monsters-v3.png");
      // Load Destroyer (Kẻ Hủy Diệt) - 5 forms
      for(let frame=0; frame<5; frame++){
        this.load.image(`destroyer-${frame}`, `/assets/monsters/shadow-animals/robot/robot-${frame}.png`);
      }
      // Load Ice Guard animations
      this.load.image("iceguard-idle", "/assets/monsters/shadow-animals/ice-guard/idle.png");
      this.load.image("iceguard-windup", "/assets/monsters/shadow-animals/ice-guard/windup.png");
      this.load.image("iceguard-swing", "/assets/monsters/shadow-animals/ice-guard/swing.png");
      this.load.image("iceguard-attack", "/assets/monsters/shadow-animals/ice-guard/attack-strip.png");
      this.load.image("iceguard-lunge", "/assets/monsters/shadow-animals/ice-guard/lunge.png");
      this.load.image("iceguard-hammer", "/assets/monsters/shadow-animals/ice-guard/hammer.png");
      this.load.image("iceguard-finish", "/assets/monsters/shadow-animals/ice-guard/finish.png");
      // Load shadow animals (6 base shadows)
      for(let frame=0; frame<6; frame++){
        this.load.image(`shadow-${frame}`, `/assets/monsters/shadow-animals/shadow-${frame}.png`);
      }
      // Load NPC frames - 20 individual NPCs
      for(let frame=0; frame<20; frame++){
        this.load.image(`npc-${frame}`, `/assets/npcs/individual/npc-${frame}.png`);
      }
      // Load village NPCs (19 NPCs for 2 villages)
      for(let frame=1; frame<=19; frame++){
        this.load.image(`village-npc-${frame.toString().padStart(2,'0')}`, `/assets/npcs/village/npc-${frame.toString().padStart(2,'0')}.png`);
      }
      // Load quest NPCs atlas
      this.load.image("quest-npcs", "/assets/npcs/quest-npcs-normalized-v2.png");
      // Load terrain assets
      this.load.image("terrain-desert", "/assets/terrain/provided/desert.png");
      this.load.image("terrain-grass-bright", "/assets/terrain/provided/grass-bright.png");
      this.load.image("terrain-grass-soft", "/assets/terrain/provided/grass-soft.png");
      this.load.image("terrain-ice-blue", "/assets/terrain/provided/ice-blue.png");
      this.load.image("terrain-ice-crystal", "/assets/terrain/provided/ice-crystal.png");
      this.load.image("terrain-ice-dark", "/assets/terrain/provided/ice-dark.png");
      this.load.image("terrain-jade-stump", "/assets/terrain/provided/jade-stump.png");
      this.load.image("terrain-rock-dark", "/assets/terrain/provided/rock-dark.png");
      this.load.image("terrain-spirit-tree", "/assets/terrain/provided/spirit-tree.png");
      // Load other assets
      this.load.image("class-atlas", "/assets/class-atlas.png");
      this.load.image("skill-atlas", "/assets/skill-atlas.png");
      this.load.image("blacksmith-npc", "/assets/blacksmith-npc.png");
      this.load.image("merchant-npc", "/assets/merchant-npc.png");
      this.load.image("login-bg", "/assets/login-yen-lang.jpg");
      // Load particle effects
      this.load.image("particle-dust", "/assets/particles/dust.png");
      this.load.image("particle-spark", "/assets/particles/spark.png");
      this.load.image("particle-leaf", "/assets/particles/leaf.png");
      this.load.image("particle-snow", "/assets/particles/snow.png");
    },
    create(this: Phaser.Scene & { 
      midElements?: Phaser.GameObjects.GameObject[];
      weatherParticles?: any;
      snowParticles?: any;
      mistParticles?: any;
      emberParticles?: any;
      lightParticles?: any;
      leafParticles?: any;
      sandParticles?: any;
      batParticles?: any;
      sporeParticles?: any;
      emberParticles2?: any;
      divineParticles?: any;
      lightningTimer?: Phaser.Time.TimerEvent;
      currentTheme?: any;
      currentZone?: number;
    }) {
      let terrain: Phaser.GameObjects.Group;
      const drawMap = () => {
        terrain?.clear(true, true);
        terrain = this.add.group();
        
        // Enhanced biome themes with more atmospheric properties
        const themes = [
          {name:"🌲 RỪNG SƠ KHAI", sky:0x173a2a, mid:0x285c3e, far:0x6fa44a, ground:0x1b4d2e, accent:0x8fd35a, type:"forest", 
            weather:"mist", particles:"leaves", ambientSound:"forest", fogDensity:0.15},
          {name:"🐗 THÔN TRƯ GIA", sky:0x36513c, mid:0x6b5b3d, far:0xb9955b, ground:0x4a3f2a, accent:0xd4a574, type:"village",
            weather:"clear", particles:"dust", ambientSound:"village", fogDensity:0.05},
          {name:"🦇 HANG BÓNG TỐI", sky:0x0a0a1a, mid:0x1a1830, far:0x3a3555, ground:0x151225, accent:0x6b5b8a, type:"cave",
            weather:"dark", particles:"bats", ambientSound:"cave", fogDensity:0.3},
          {name:"🍄 ĐẦM NẤM ĐỘC", sky:0x2d3d28, mid:0x4a5d3a, far:0x8fb85a, ground:0x2a4525, accent:0xb8e57a, type:"swamp",
            weather:"fog", particles:"spores", ambientSound:"swamp", fogDensity:0.25},
          {name:"🏜️ SA MẠC XÍCH PHONG", sky:0x7a4d23, mid:0xc56b42, far:0xf0c56b, ground:0x8b5a2b, accent:0xffc97a, type:"desert",
            weather:"heat", particles:"sand", ambientSound:"wind", fogDensity:0.1},
          {name:"🎋 TRÚC LÂM MÊ VỤ", sky:0x1d4c42, mid:0x317361, far:0x74b58c, ground:0x255a3a, accent:0x9fd4a3, type:"bamboo",
            weather:"mist", particles:"leaves", ambientSound:"bamboo", fogDensity:0.2},
          {name:"❄️ BĂNG NGUYÊN VĨNH DẠ", sky:0x4a6d86, mid:0x8fc7d8, far:0xe7fbff, ground:0x5a8d9e, accent:0xcceeff, type:"ice",
            weather:"snow", particles:"snow", ambientSound:"ice", fogDensity:0.15},
          {name:"⚡ LÔI SƠN CỔ ĐẠO", sky:0x242744, mid:0x4f5680, far:0x9f8bc7, ground:0x2d3055, accent:0xb8a0e0, type:"storm",
            weather:"storm", particles:"lightning", ambientSound:"thunder", fogDensity:0.2},
          {name:"🌙 HUYẾT NGUYỆT MA THÀNH", sky:0x381010, mid:0x721f1b, far:0xe13b32, ground:0x4a1a1a, accent:0xff6b6b, type:"blood",
            weather:"crimson", particles:"embers", ambientSound:"dark", fogDensity:0.25},
          {name:"☁️ THIÊN MÔN YÊN LÃNG", sky:0x335878, mid:0x6fa7b8, far:0xffd978, ground:0x4a6a55, accent:0xfff0a0, type:"heaven",
            weather:"ethereal", particles:"light", ambientSound:"heaven", fogDensity:0.1},
        ];
        
        // Time of day cycle (affects lighting)
        const timeOfDay = Math.floor(Date.now() / 120000) % 4; // 0=dawn, 1=day, 2=dusk, 3=night
        const timeModifiers = [
          {skyMul:0.7, ambient:0xffe5b4}, // dawn
          {skyMul:1.0, ambient:0xffffff}, // day
          {skyMul:0.6, ambient:0xffcc88}, // dusk
          {skyMul:0.3, ambient:0x444466}, // night
        ];
        const timeMod = timeModifiers[timeOfDay];
        const zone=map%themes.length;
        const t = themes[zone];
        const night=[2,6,7,8].includes(zone);
        
        // Apply time of day lighting
        const skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(t.sky),
          Phaser.Display.Color.ValueToColor(timeMod.ambient),
          10, Math.floor(3 * timeMod.skyMul)
        );
        this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(skyColor.r, skyColor.g, skyColor.b));
        
        // ===== PARALLAX BACKGROUND LAYERS =====
        // Far mountains (slowest parallax)
        for(let layer=0; layer<3; layer++){
          const alpha = 0.15 - layer * 0.04;
          const yBase = 180 + layer * 40;
          const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(t.far),
            Phaser.Display.Color.ValueToColor(t.mid),
            2, layer
          );
          const mountainColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
          for(let i=0;i<5;i++){
            const mx = -100 + i * 500 + (layer * 80);
            const my = yBase + (i%2)*60;
            const mw = 400 + (i%3)*150;
            const mh = 200 + (i%2)*80;
            terrain.add(this.add.triangle(mx, my+mh, mx+mw/2, my, mx+mw, my+mh, mountainColor, alpha));
          }
        }
        
        // Sky elements
        if(night){
          // Moon with glow
          const moon = this.add.circle(760, 82, 42, 0xd7e6ff, 0.78);
          terrain.add(moon);
          // Moon glow layers
          for(let g=0;g<3;g++) terrain.add(this.add.circle(760,82,50+g*15,0xd7e6ff,0.08-g*0.02));
          // Stars with twinkle
          for(let i=0;i<30;i++){
            const sx = 28+(i*137)%850;
            const sy = 28+(i*61)%170;
            const star = this.add.circle(sx, sy, 1.5+i%2, 0xffffff, 0.6);
            terrain.add(star);
            this.tweens.add({targets:star,alpha:{from:0.3,to:1},duration:1500+i*200,yoyo:true,repeat:-1,ease:"Sine.inOut"});
          }
          // Floating particles (spirit motes)
          for(let i=0;i<15;i++){
            const px = Phaser.Math.Between(0, WORLD_WIDTH);
            const py = Phaser.Math.Between(50, 250);
            const mote = this.add.circle(px, py, Phaser.Math.FloatBetween(0.8, 2), 0xa8d0ff, Phaser.Math.FloatBetween(0.15, 0.4));
            terrain.add(mote);
            this.tweens.add({targets:mote,y:py-30,x:px+Phaser.Math.Between(-20,20),alpha:0,duration:Phaser.Math.Between(4000,8000),repeat:-1,delay:Phaser.Math.Between(0,4000),ease:"Sine.out"});
          }
        }else{
          // Sun with rays
          const sun = this.add.circle(760, 82, 58, 0xffe59a, 0.88);
          terrain.add(sun);
          for(let g=0;g<4;g++) terrain.add(this.add.circle(760,82,68+g*12,0xffd96b,0.06-g*0.01));
          // Sun rays
          for(let r=0;r<12;r++){
            const angle = (r/12)*Math.PI*2;
            const ray = this.add.line(760,82,0,0,Math.cos(angle)*120,Math.sin(angle)*120,0xffe59a,0.15);
            terrain.add(ray);
            this.tweens.add({targets:ray,angle:angle+0.1,duration:20000,repeat:-1,ease:"Linear"});
          }
          // Clouds
          for(let i=0;i<8;i++){
            const cx = -100 + i * 280 + Phaser.Math.Between(-50,50);
            const cy = 60 + (i%3)*40;
            const cloud = this.add.ellipse(cx, cy, 180+i%2*80, 45, 0xffffff, 0.25);
            terrain.add(cloud);
            this.tweens.add({targets:cloud,x:cx+WORLD_WIDTH+200,duration:Phaser.Math.Between(60000,120000),repeat:-1,ease:"Linear",onComplete:()=>{cloud.x=-200;}});
          }
        }
        
        // Mid-ground scenery (trees, rocks, structures)
        const midElements = [];
        for(let i=0;i<20;i++){
          const px = 45 + i * 110;
          const baseY = 330;
          if(t.type==="forest"||t.type==="bamboo"||t.type==="village"){
            // Trees with trunks and canopy
            const trunk = this.add.rectangle(px, baseY+40, 14, 110, t.ground).setStrokeStyle(3,0x172033);
            terrain.add(trunk); midElements.push(trunk);
            const canopy1 = this.add.circle(px-18, baseY-30, 28, t.mid, 0.9).setStrokeStyle(3,0x172033);
            const canopy2 = this.add.circle(px+15, baseY-40, 36, t.mid, 0.84).setStrokeStyle(3,0x172033);
            terrain.add(canopy1); terrain.add(canopy2);
            midElements.push(canopy1, canopy2);
            // Sway animation
            this.tweens.add({targets:[canopy1,canopy2],rotation:{from:-0.03,to:0.03},duration:3000+i*200,yoyo:true,repeat:-1,ease:"Sine.inOut"});
          }else if(t.type==="desert"){
            // Cacti
            const cactus = this.add.rectangle(px, baseY+50, 12, 70, 0x4a8b48).setStrokeStyle(3,0x24452a);
            const arm1 = this.add.rectangle(px-13, baseY+30, 18, 8, 0x4a8b48);
            const arm2 = this.add.rectangle(px+12, baseY+14, 18, 8, 0x4a8b48);
            terrain.add(cactus); terrain.add(arm1); terrain.add(arm2);
            midElements.push(cactus, arm1, arm2);
          }else if(t.type==="ice"||t.type==="heaven"){
            // Snow peaks / cloud pillars
            const peak = this.add.triangle(px, baseY+35, px-35, baseY-30, px+35, baseY+35, 0xdffaff, 0.75).setStrokeStyle(3,0x6ca8bd);
            terrain.add(peak); midElements.push(peak);
          }else{
            // Dead trees / spooky silhouettes
            const dead = this.add.polygon(px, baseY+10,[0,-52,25,-22,18,34,-18,34,-25,-22],t.type==="blood"?0x351319:0x28243b,0.9);
            terrain.add(dead); midElements.push(dead);
          }
        }
        
        // Ground layers with detail
        // Deep ground
        terrain.add(this.add.rectangle(WORLD_WIDTH/2, 450, WORLD_WIDTH, 140, t.ground).setStrokeStyle(5, 0x172033));
        // Surface tiles with grass/dirt detail
        for (let x = 0; x < WORLD_WIDTH; x += 48) {
          const tile = this.add.rectangle(x + 24, 386, 46, 18, t.mid).setStrokeStyle(2, 0x172033);
          terrain.add(tile);
          const tile2 = this.add.rectangle(x + 24, 410, 46, 28, t.ground).setStrokeStyle(1, 0x172033, .45);
          terrain.add(tile2);
          // Small grass tufts / rocks
          const detail = this.add.circle(x+10+(x%3)*7,397+(x%4)*13,3+(x%5),t.accent,0.5);
          terrain.add(detail);
          // Subtle sway for grass
          if(t.type==="forest"||t.type==="bamboo"||t.type==="village"){
            this.tweens.add({targets:detail,rotation:{from:-0.05,to:0.05},duration:2500+x*30,yoyo:true,repeat:-1,ease:"Sine.inOut"});
          }
        }
        
        // Foreground mist / atmosphere
        const mist = this.add.ellipse(450,320,980,100,t.far,0.12);
        terrain.add(mist);
        this.tweens.add({targets:mist,alpha:{from:0.08,to:0.18},duration:4000,yoyo:true,repeat:-1,ease:"Sine.inOut"});
        
        // Ground highlight line
        terrain.add(this.add.rectangle(450,350,900,38,t.sky,0.32));
        
        // Decorative foreground plants/rocks
        for(let i=0;i<28;i++){
          const px = 18 + i * 79;
          const plant = this.add.ellipse(px, 371, 26+i%3*8, 9, t.mid, 0.7).setStrokeStyle(2, t.sky, 0.5);
          terrain.add(plant);
          if(t.type==="forest"||t.type==="bamboo"){
            this.tweens.add({targets:plant,scaleX:{from:1,to:1.05},duration:2000+i*100,yoyo:true,repeat:-1,ease:"Sine.inOut"});
          }
        }
        
        // Zone gate
        terrain.add(this.add.rectangle(WORLD_WIDTH-115,370,170,18,t.mid).setStrokeStyle(3,0x172033));
        terrain.add(this.add.text(WORLD_WIDTH-176,344,"CỔNG KHU VỰC",{fontSize:"14px",color:"#172033",fontStyle:"bold"}));
        
        // Zone name with animated entrance
        const zoneText = this.add.text(24,22,t.name,{fontSize:"20px",color:"#ffffff",fontStyle:"bold",stroke:"#111827",strokeThickness:5}).setAlpha(0);
        terrain.add(zoneText);
        this.tweens.add({targets:zoneText,alpha:1,y:18,duration:800,ease:"Back.out",delay:200});
        
        terrain.setDepth(-5);
        
        // ===== WEATHER PARTICLE SYSTEM =====
        this.weatherParticles = this.add.particles(0, 0, "particle-dust", {
          x: { min: 0, max: WORLD_WIDTH },
          y: { min: -100, max: 100 },
          lifespan: { min: 3000, max: 8000 },
          speedX: { min: -20, max: 20 },
          speedY: { min: 10, max: 50 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.3, end: 0 },
          quantity: 2,
          frequency: 800,
          emitting: t.weather !== "clear" && t.weather !== "ethereal"
        });
        this.weatherParticles.setDepth(-4);
        
        // Weather-specific particles
        if (t.weather === "snow") {
          this.snowParticles = this.add.particles(0, 0, "particle-snow", {
            x: { min: 0, max: WORLD_WIDTH },
            y: -100,
            lifespan: { min: 5000, max: 10000 },
            speedX: { min: -30, max: 30 },
            speedY: { min: 50, max: 120 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            quantity: 3,
            frequency: 300,
            emitting: true
          });
          this.snowParticles.setDepth(-3);
        } else if (t.weather === "mist" || t.weather === "fog") {
          this.mistParticles = this.add.particles(0, 0, "particle-dust", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 350, max: 400 },
            lifespan: { min: 8000, max: 15000 },
            speedX: { min: -5, max: 5 },
            speedY: { min: -2, max: 2 },
            scale: { start: 1, end: 2 },
            alpha: { start: 0.1, end: 0 },
            quantity: 1,
            frequency: 2000,
            emitting: true,
            blendMode: "ADD"
          });
          this.mistParticles.setDepth(-2);
        } else if (t.weather === "storm") {
          this.lightningTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 8000),
            loop: true,
            callback: () => {
              this.cameras.main.flash(100, 255, 255, 255, false);
              this.time.delayedCall(50, () => this.cameras.main.flash(50, 200, 200, 255, false));
            }
          });
        } else if (t.weather === "crimson") {
          this.emberParticles = this.add.particles(0, 0, "particle-spark", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 300, max: 450 },
            lifespan: { min: 2000, max: 4000 },
            speedX: { min: -10, max: 10 },
            speedY: { min: -80, max: -20 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            quantity: 2,
            frequency: 500,
            emitting: true,
            blendMode: "ADD"
          });
          this.emberParticles.setDepth(-2);
        } else if (t.weather === "ethereal") {
          this.lightParticles = this.add.particles(0, 0, "particle-spark", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 100, max: 400 },
            lifespan: { min: 3000, max: 6000 },
            speedX: { min: -15, max: 15 },
            speedY: { min: -30, max: 30 },
            scale: { start: 0.3, end: 0.8 },
            alpha: { start: 0.4, end: 0 },
            quantity: 2,
            frequency: 600,
            emitting: true,
            blendMode: "ADD",
            tint: [0xffd700, 0xfff0a0, 0xffe5b4]
          });
          this.lightParticles.setDepth(-2);
        } else if (t.particles === "leaves") {
          this.leafParticles = this.add.particles(0, 0, "particle-leaf", {
            x: { min: 0, max: WORLD_WIDTH },
            y: -50,
            lifespan: { min: 8000, max: 15000 },
            speedX: { min: -40, max: 40 },
            speedY: { min: 30, max: 100 },
            scale: { start: 0.4, end: 0.2 },
            alpha: { start: 0.5, end: 0 },
            rotate: { min: -180, max: 180 },
            quantity: 1,
            frequency: 1500,
            emitting: true
          });
          this.leafParticles.setDepth(-2);
        } else if (t.particles === "sand") {
          this.sandParticles = this.add.particles(0, 0, "particle-dust", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 350, max: 380 },
            lifespan: { min: 2000, max: 4000 },
            speedX: { min: -60, max: 60 },
            speedY: { min: -20, max: 20 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.4, end: 0 },
            quantity: 3,
            frequency: 400,
            emitting: true
          });
          this.sandParticles.setDepth(-2);
        } else if (t.particles === "bats") {
          this.batParticles = this.add.particles(0, 0, "particle-dust", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 50, max: 200 },
            lifespan: { min: 3000, max: 6000 },
            speedX: { min: -80, max: 80 },
            speedY: { min: -40, max: 40 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            quantity: 1,
            frequency: 2000,
            emitting: true,
            tint: 0x1a1a2e
          });
          this.batParticles.setDepth(-2);
        } else if (t.particles === "spores") {
          this.sporeParticles = this.add.particles(0, 0, "particle-spark", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 300, max: 420 },
            lifespan: { min: 4000, max: 8000 },
            speedX: { min: -10, max: 10 },
            speedY: { min: -30, max: 10 },
            scale: { start: 0.15, end: 0.3 },
            alpha: { start: 0.3, end: 0 },
            quantity: 2,
            frequency: 800,
            emitting: true,
            blendMode: "ADD",
            tint: [0xb8e57a, 0x8fd35a, 0x6fa44a]
          });
          this.sporeParticles.setDepth(-2);
        } else if (t.particles === "embers") {
          this.emberParticles2 = this.add.particles(0, 0, "particle-spark", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 350, max: 450 },
            lifespan: { min: 1500, max: 3000 },
            speedX: { min: -20, max: 20 },
            speedY: { min: -100, max: -30 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.7, end: 0 },
            quantity: 3,
            frequency: 400,
            emitting: true,
            blendMode: "ADD",
            tint: [0xff6b6b, 0xff8c42, 0xffd700]
          });
          this.emberParticles2.setDepth(-2);
        } else if (t.particles === "light") {
          this.divineParticles = this.add.particles(0, 0, "particle-spark", {
            x: { min: 0, max: WORLD_WIDTH },
            y: { min: 50, max: 350 },
            lifespan: { min: 4000, max: 8000 },
            speedX: { min: -10, max: 10 },
            speedY: { min: -20, max: 20 },
            scale: { start: 0.4, end: 1.2 },
            alpha: { start: 0.3, end: 0 },
            quantity: 2,
            frequency: 700,
            emitting: true,
            blendMode: "ADD",
            tint: [0xffd700, 0xfff8e7, 0xffe5b4, 0xffebcd]
          });
          this.divineParticles.setDepth(-2);
        }
        
        // Store mid-elements for parallax
        (this as any).midElements = midElements;
        this.currentTheme = t;
        this.currentZone = zone;
      };
      drawMap();
      const mapLabel=document.querySelector(".map-select") as HTMLElement;
      const updateMapLabel=()=>{
        const current=MAPS[map];
        mapLabel.innerHTML=`<strong>📍 MAP ${map+1}/${MAPS.length} • ${current[0]} <small>Lv.${current[1]}+</small></strong><span>Đi tới mép bản đồ để dùng BACK / NEXT</span>`;
      };
      updateMapLabel();
      // Keep the hero clear of the joystick overlay on landscape phones.
      // The top edge of the visible soil is the common feet line for every
      // grounded actor. Keeping this in one place prevents NPCs/mobs from
      // drifting when the map art changes.
      const GROUND_Y = 374;
      const player = this.add.container(245,GROUND_Y).setDepth(GROUND_Y);
      // This scene uses manual movement and does not enable a Phaser physics
      // plugin. Accessing `this.physics.world` aborted create() on Android
      // immediately after the background was drawn, leaving an empty map.
      this.cameras.main.setBounds(0,0,WORLD_WIDTH,520).startFollow(player,true,.1,.1);
      const heroIndex=classIndex(hero!.classId), cell=1914/7;
      const customHero=hero!.classId==="wukong"||hero!.classId==="bajie";
      const heroArt=this.add.image(0,0,customHero?`hero-${hero!.classId}`:"spirits").setOrigin(.5,1);
      // Keep the hero readable without letting it dominate the battlefield.
      // Wukong's source art is wider, so he gets a slightly wider frame while
      // all four classes share a compact visual height.
      if(customHero) heroArt.setDisplaySize(hero!.classId==="wukong"?105:88,134);
      else heroArt.setCrop(heroIndex*cell,0,cell,822).setDisplaySize(88,130);
      const heroBaseScaleX=heroArt.scaleX, heroBaseScaleY=heroArt.scaleY;
      const heroShadow=this.add.ellipse(0,2,72,15,0x000000,.3);
      player.add([heroShadow,heroArt]); player.setSize(90,132);
      let heroMotion: Phaser.Tweens.Tween | null = null;
      let heroState = "idle";
      // Input state lives independently from combat animation. Attacking or
      // taking damage must never cancel a held joystick direction.
      let moving = 0;
      // Facing is state, not an animation frame.  Idle/breathing must keep the
      // last direction instead of alternating left/right every tween cycle.
      let heroFacing: 1|-1 = 1;
      let stickPointer: number | null = null;
      const playHeroMotion = (state: "idle"|"run"|"attack"|"skill"|"hurt") => {
        heroState = state;
        heroMotion?.stop();
        this.tweens.killTweensOf(heroArt);
        heroArt.setPosition(0,0).setAngle(0).setScale(heroBaseScaleX,heroBaseScaleY).clearTint();
        const id=hero!.classId;
        if(state==="idle"){
          // Each hero breathes with a different weight and rhythm.
          const dy=id==="bajie"?3:id==="tang"?2:5;
          heroMotion=this.tweens.add({targets:heroArt,y:-dy,scaleX:heroBaseScaleX*(id==="bajie"?1.025:1.01),scaleY:heroBaseScaleY*(id==="bajie"?.985:1),duration:id==="wukong"?430:id==="bajie"?820:650,yoyo:true,repeat:-1,ease:"Sine.inOut"});
        }else if(state==="run"){
          heroMotion=this.tweens.add({targets:heroArt,y:-8,angle:id==="wukong"?5:id==="bajie"?2:3,scaleX:heroBaseScaleX*(id==="bajie"?1.04:1),scaleY:heroBaseScaleY*(id==="bajie"?.96:1),duration:id==="wukong"?105:id==="bajie"?185:140,yoyo:true,repeat:-1,ease:"Sine.inOut"});
        }else if(state==="attack"){
          const angle=id==="wukong"?18:id==="bajie"?10:id==="wujing"?14:4;
          heroMotion=this.tweens.add({targets:heroArt,x:id==="tang"?0:12,y:id==="bajie"?3:-5,angle,scaleX:heroBaseScaleX*(id==="bajie"?1.08:1.02),scaleY:heroBaseScaleY*(id==="bajie"?.92:.98),duration:id==="wukong"?75:110,yoyo:true,hold:35,ease:"Quad.out",onComplete:()=>playHeroMotion(moving?"run":"idle")});
        }else if(state==="skill"){
          const boost=id==="tang"?1.1:1.05;
          heroMotion=this.tweens.add({targets:heroArt,y:id==="wukong"?-20:-8,angle:id==="wujing"?-10:id==="bajie"?7:0,scaleX:heroBaseScaleX*boost,scaleY:heroBaseScaleY*boost,duration:145,yoyo:true,hold:90,ease:"Back.out",onComplete:()=>playHeroMotion(moving?"run":"idle")});
        }else{
          heroArt.setTint(0xff7777);
          heroMotion=this.tweens.add({targets:heroArt,x:-7,angle:-6,scaleY:heroBaseScaleY*.92,duration:65,yoyo:true,repeat:1,onComplete:()=>playHeroMotion(moving?"run":"idle")});
        }
      };
      playHeroMotion("idle");
      const npc=this.add.container(92,GROUND_Y-2).setDepth(GROUND_Y-2).setSize(126,146).setInteractive(new Phaser.Geom.Rectangle(-63,-146,126,154),Phaser.Geom.Rectangle.Contains);
      const npcShadow=this.add.ellipse(0,2,66,13,0x000000,.24);
      const npcArt=this.add.image(0,0,"npc-0").setOrigin(.5,1);
      const npcQuest=this.add.text(0,-128,"!",{fontSize:"25px",color:"#ffd65a",fontStyle:"bold",stroke:"#241a14",strokeThickness:5}).setOrigin(.5);
      const npcName=this.add.text(0,17,"",{fontSize:"11px",color:"#fff4bf",fontStyle:"bold",stroke:"#111",strokeThickness:3}).setOrigin(.5);
      npc.add([npcShadow,npcArt,npcQuest,npcName]);
      const updateNpc=()=>{
        // Every marked NPC now has its own fixed texture. The later maps use
        // the newly supplied characters instead of repeating the first atlas.
        const npcFrames=[0,1,2,3,4,5,6,7,9,5,11,14,16,13,12,10,15,8,10,8];
        const npcWidths=[112,122,112,112,112,112,112,112,102,74,79,79,76,91,75,89,76];
        const frame=npcFrames[map]??0;
        // Switching a complete texture preserves hats, staffs, sleeves and
        // feet; no crop/mask is allowed on NPC art.
        npcArt.setTexture(`npc-${frame}`).setDisplaySize(npcWidths[frame]??112,134);
        npcName.setText(String(MAPS[map][3]));
      };
      updateNpc();
      npc.on("pointerdown",(_pointer:Phaser.Input.Pointer,_x:number,_y:number,event:Phaser.Types.Input.EventData)=>{event.stopPropagation();npcSelected=true;selectedEnemy=null;updateTargetHud();});
      this.add
        .text(245, GROUND_Y+18, hero!.name, {
          fontSize: "15px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#111827",
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      const spawnPack = () => {
        enemies.forEach(e => e.destroy());
        enemies = [];
        const m = MAPS[map];
        // Ground monsters share one feet line. Flying monsters keep a stable
        // flight altitude; only they are allowed to bob vertically.
        const regularCount=Phaser.Math.Between(5,7);
        const spots=Array.from({length:regularCount},(_,i)=>390+i*((WORLD_WIDTH-680)/Math.max(1,regularCount-1)));
        spots.push(WORLD_WIDTH-190);
        const monsterKinds = [
          { name:"Slime Rêu", frame:0, flying:false, ranged:false, width:62, height:52 },
          { name:"Trư Yêu Sừng", frame:1, flying:false, ranged:false, width:64, height:69 },
          { name:"Nấm Độc Nhãn", frame:2, flying:false, ranged:true, width:61, height:66 },
          { name:"Giáp Trùng Đá", frame:3, flying:false, ranged:false, width:70, height:56 },
          { name:"Dơi Tử Ảnh", frame:4, flying:true, ranged:true, width:72, height:61 },
          { name:"Hỏa Hồ", frame:5, flying:false, ranged:true, width:71, height:58 },
          { name:"Trúc Quỷ Cung", frame:6, flying:false, ranged:true, width:59, height:68 },
          { name:"Lam Quỷ Vương", frame:7, flying:false, ranged:false, width:91, height:91 },
        ];
        // Visible alpha bounds inside each 4x2 atlas cell.  Display sizes must
        // target the painted silhouette, not the transparent square around it.
        const frameBBox = [
          {minX:67,minY:124,maxX:433,maxY:377,cellW:444,cellH:444},
          {minX:74,minY:82,maxX:389,maxY:382,cellW:443,cellH:444},
          {minX:56,minY:77,maxX:443,maxY:387,cellW:444,cellH:444},
          {minX:0,minY:113,maxX:367,maxY:387,cellW:443,cellH:444},
          {minX:38,minY:56,maxX:439,maxY:347,cellW:444,cellH:443},
          {minX:72,minY:46,maxX:394,maxY:354,cellW:443,cellH:443},
          {minX:26,minY:61,maxX:443,maxY:354,cellW:444,cellH:443},
          {minX:0,minY:11,maxX:372,maxY:354,cellW:443,cellH:443},
        ];
        const TARGET_H_NORMAL=115;
        const TARGET_H_ELITE=138;
        const computeDisplaySize=(frameIdx:number,elite:boolean)=>{
          const bounds=frameBBox[frameIdx];
          const targetH=elite?TARGET_H_ELITE:TARGET_H_NORMAL;
          const boxW=bounds.maxX-bounds.minX+1;
          const boxH=bounds.maxY-bounds.minY+1;
          // Scale source pixels uniformly until the painted silhouette reaches
          // targetH; this avoids both distortion and padding-driven oversizing.
          const scale=targetH/boxH;
          const displayW=Math.round(bounds.cellW*scale);
          const displayH=Math.round(bounds.cellH*scale);
          const visibleW=Math.round(boxW*scale);
          // Keep the image origin at the cell bottom, then compensate for the
          // transparent bottom and off-centre alpha bounds in local pixels.
          const centerX=(bounds.minX+bounds.maxX+1)/2;
          const offsetX=(.5-centerX/bounds.cellW)*displayW;
          const offsetY=((bounds.cellH-bounds.maxY-1)/bounds.cellH)*displayH;
          return {displayW,displayH,visibleW,visibleH:targetH,offsetX,offsetY};
        };
        const mapSpecies = [
          ["Mộc Linh","Thỏ Lá","Giáp Trùng Rêu"], ["Trư Yêu Con","Heo Nanh","Thổ Trư"],
          ["Dơi Tử Ảnh","Âm Hồn","Nhện Hang"], ["Nấm Độc Nhãn","Cóc Độc","Đỉa Đầm"],
          ["Hỏa Hồ","Bọ Cạp Đỏ","Sa Trùng"], ["Trúc Quỷ Cung","Phong Điệp","Mộc Khôi"],
          ["Sói Băng","Băng Linh","Tuyết Bức"], ["Lôi Giáp Trùng","Điểu Sét","Thạch Khôi"],
          ["Huyết Dực Yêu","Ma Hồ","Quỷ Nhãn"], ["Lam Quỷ Vương","Thiên Hạc","Vân Linh"],
        ];
        const mapTints=[0xd8ffc5,0xffc39c,0xc2a8ff,0xb7ef87,0xffa76f,0x9ff2c1,0xc7efff,0xd7c5ff,0xff8c89,0xb8efff];
        const grassEliteKinds = [
          {id:"grass-elite-0",name:"Hỏa Long Nhân",width:339,height:420,flying:false,ranged:false},
          {id:"grass-elite-1",name:"Kiếm Sĩ Huyết Giáp",width:416,height:395,flying:false,ranged:false},
          {id:"grass-elite-2",name:"Cổ Thụ Vương",width:454,height:517,flying:false,ranged:true},
          {id:"grass-elite-3",name:"Thổ Giáp Cự Thú",width:432,height:395,flying:false,ranged:false},
          {id:"grass-elite-4",name:"Mộc Long Tinh",width:505,height:496,flying:false,ranged:true},
          {id:"grass-elite-5",name:"Xích Dực Yêu",width:511,height:503,flying:true,ranged:true},
        ] as const;
        // Shadow animals spawn only on night maps. The Destroyer (shadow robot)
        // is the night elite: every 20% HP lost it shifts one form and deals
        // more damage, up to 5 forms. Each kind carries its own attack FX.
        const shadowKinds = [
          {id:"shadow-0",name:"Hắc Lang",width:334,height:383,flying:false,ranged:false,effect:"wolf"},
          {id:"shadow-1",name:"Kẻ Hủy Diệt",width:199,height:302,flying:false,ranged:false,effect:"destroyer"},
          {id:"shadow-2",name:"Hươu Bóng Tối",width:383,height:699,flying:false,ranged:false,effect:"deer"},
          {id:"shadow-3",name:"Lính Băng",width:232,height:264,flying:false,ranged:false,effect:"ice"},
          {id:"shadow-4",name:"Tê Giác Bóng Tối",width:537,height:568,flying:false,ranged:false,effect:"rhino"},
          {id:"shadow-5",name:"Hắc Báo",width:259,height:263,flying:false,ranged:false,effect:"panther"},
        ] as const;
        spots.forEach((x, i) => {
          const elite = i === spots.length - 1;
          const zone=map%10;
          const isNightMap=[2,6,7,8].includes(zone);
          const isGreenGrassMap=[0,1,3,5].includes(zone);
          const grassElite=elite&&isGreenGrassMap ? grassEliteKinds[map%grassEliteKinds.length] : null;
          const shadowElite=elite&&isNightMap;
          const shadowPool=zone===6?[0,2,3,4,5]:[0,2,4,5];
          const shadowKind=shadowElite?shadowKinds[1]:(!elite&&isNightMap)?shadowKinds[shadowPool[(i+map)%shadowPool.length]]:null;
          const bossTier = elite ? (grassElite ? "elite" : shadowElite ? "elite" : zone >= 8 ? "high" : zone >= 4 ? "mid" : "elite") : "normal";
          const lv = Number(m[1]) + Math.floor(Math.random()*4) + (elite ? 3 : 0);
          const hp = (45 + lv*14) * (bossTier==="high" ? 11 : bossTier==="mid" ? 7 : elite ? 5 : 1);
          // Normal mobs are selected only from the regular pool. Grass elites
          // use their own immutable id/name/texture and can never be selected
          // here as a regular monster.
          const baseKind = monsterKinds[(i + map * 2) % 7];
          const midBossFrame=map%2;
          const kind = {...baseKind, name: shadowKind?.name ?? grassElite?.name ?? (bossTier==="high" ? (zone===9?"Hoàng Mi Chân Thân":"Hoàng Mi Quái") : bossTier==="mid" ? (midBossFrame===0?"Hắc Cẩu Đại Vương":"Bạch Mao Lão Thử Tinh") : elite ? `${MAPS[map][2]} Tinh Anh` : mapSpecies[zone][i%3])};
          const flying=shadowKind?.flying??grassElite?.flying??kind.flying;
          const ape=kind.frame===1||kind.frame===7;
          const y=flying?GROUND_Y-74:GROUND_Y;
          const regularSize=computeDisplaySize(kind.frame,elite);
          const grassEliteHeight=138;
          const grassEliteWidth=grassElite?Math.round(grassEliteHeight*grassElite.width/grassElite.height):0;
          const shadowHeight=shadowKind?(shadowElite?150:118):0;
          const shadowWidth=shadowKind?Math.round(shadowHeight*shadowKind.width/shadowKind.height):0;
          const bodyWidth=shadowKind?shadowWidth:grassElite?grassEliteWidth:bossTier==="high"?158:bossTier==="mid"?(midBossFrame===0?136:124):regularSize.displayW;
          const bodyHeight=shadowKind?shadowHeight:grassElite?grassEliteHeight:bossTier==="high"?174:bossTier==="mid"?(midBossFrame===0?147:128):regularSize.displayH;
          const actorWidth=shadowKind?shadowWidth:grassElite?grassEliteWidth:bossTier==="normal"||bossTier==="elite"?regularSize.visibleW:bodyWidth;
          const actorHeight=shadowKind?shadowHeight:grassElite?grassEliteHeight:bossTier==="normal"||bossTier==="elite"?regularSize.visibleH:bodyHeight;
          // Resolve horizontal packing from the real painted width.  This is
          // done after size calculation so broad monsters/bosses cannot share
          // pixels even when their atlas cells have very different padding.
          const previous=enemies[enemies.length-1];
          const separation=(previous?.actorWidth||0)/2+actorWidth/2+(flying||previous?.flying?40:26);
          if(previous)x=Math.max(x,previous.root.x+separation);
          x=Math.min(x,WORLD_WIDTH-actorWidth/2-34);
          const root = this.add.container(x,y).setDepth(y).setSize(actorWidth+28,actorHeight+24).setInteractive(new Phaser.Geom.Rectangle(-(actorWidth+28)/2,-actorHeight-14,actorWidth+28,actorHeight+28),Phaser.Geom.Rectangle.Contains);
          const aura = this.add.ellipse(0,2,bossTier==="high"?170:elite?Math.max(112,actorWidth*.72):actorWidth*.72,bossTier==="high"?36:elite?28:18,shadowElite?0xd93a4b:(bossTier==="high"?0xe44dff:elite?0xffc83d:0x000000),elite ? .3 : .2);
          const bodyTexture=shadowKind?.id ?? grassElite?.id ?? (bossTier==="high"?"boss-huangmei":bossTier==="mid"?"mid-bosses":`monster-${kind.frame}`);
          const body = this.add.image(0,0,bodyTexture).setOrigin(.5,1);
          if(bossTier==="high") body.setCrop(0,0,1625/2,968).setDisplaySize(bodyWidth,bodyHeight);
          else if(bossTier==="mid") body.setCrop(midBossFrame*(1774/2),0,1774/2,887).setDisplaySize(bodyWidth,bodyHeight);
          else if(shadowKind) body.setDisplaySize(bodyWidth,bodyHeight);
          else if(grassElite) body.setDisplaySize(bodyWidth,bodyHeight);
          else {
            body.setDisplaySize(bodyWidth,bodyHeight)
              .setPosition(regularSize.offsetX,regularSize.offsetY)
              .setTint(elite?0xffe18a:mapTints[zone]);
          }
          const bodyBaseScaleX=body.scaleX, bodyBaseScaleY=body.scaleY;
          root.add([aura,body]);
          const labelY=-actorHeight-(elite?20:12);
          const rank=bossTier==="high"?"◆ BOSS CAO CẤP":bossTier==="mid"?"◆ BOSS TẦM TRUNG":elite?"★":"";
          const label = this.add.text(0,labelY,elite?`${rank} ${kind.name.toUpperCase()} • Lv.${lv}`:`${kind.name} • Lv.${lv}`,{fontSize:bossTier==="high"?"15px":elite?"14px":"11px",color:bossTier==="high"?"#ff8cff":elite?"#ffd65a":"#fff",fontStyle:"bold",stroke:"#111827",strokeThickness:4}).setOrigin(.5);
          const barWidth=bossTier==="high"?164:bossTier==="mid"?138:elite?116:78, barY=12;
          const barBg=this.add.rectangle(0,barY,barWidth+6,elite?13:11,0x090c12).setStrokeStyle(2,0xffffff,.75);
          const bar=this.add.rectangle(-barWidth/2,barY,barWidth,elite?9:7,elite?0xffc83d:0x42e56f).setOrigin(0,.5);
          const hpText=this.add.text(0,barY,`${hp}/${hp}`,{fontSize:elite?"10px":"9px",color:"#ffffff",fontStyle:"bold",stroke:"#111",strokeThickness:2}).setOrigin(.5);
          root.add([label,barBg,bar,hpText]);
          const midBossSkillSets=[
            ["Hắc Nha Trảo","Cẩu Vương Khiếu","Ảnh Bộ Phản Kích","Thiên Khuyển Trụy Sát"],
            ["Bạch Mao Liên Trảo","Thử Ảnh Phân Thân","Độc Nha Phi Châm","Vạn Thử Phệ Hồn"],
          ];
          const highBossSkillSets=[
            ["Hắc Phong Trượng","Kim Nhiễu Trói Hồn","Hoàng Mi Chấn Địa","Yêu Quang Phá","Cuồng Thể Giáng Thế"],
            ["Ma Quang Phệ Hồn","Thiên La Kim Võng","Cự Trượng Liên Kích","Hoàng Mi Diệt Giới","Chân Thân Cuồng Bạo"],
          ];
          const bossSkills=bossTier==="high" ? highBossSkillSets[zone%2] : bossTier==="mid" ? midBossSkillSets[midBossFrame] : [];
          const mob:any={root,body,bodyBaseScaleX,bodyBaseScaleY,label,barBg,bar,hpText,hp,max:hp,lv,elite,bossTier,bossSkills,form:1,skillClock:0,flying,ape,ranged:shadowKind?.ranged??grassElite?.ranged??(kind.ranged||bossTier!=="normal"),name:kind.name,frame:kind.frame,textureId:bodyTexture,eliteId:grassElite?.id??null,shadowType:shadowKind?.effect??null,atkMult:1,iceCycle:null,idleSweep:null,stopIdleSweep:null,aggro:false,x,actorWidth,actorHeight,facing:-1,alive:true,destroy(){this.iceCycle?.remove();this.idleSweep?.destroy();root.destroy();}};
          // Selecting a monster is explicit and does not also trigger an
          // attack through the scene-wide pointer handler.
          root.on("pointerdown",(pointer:Phaser.Input.Pointer,_x:number,_y:number,event:Phaser.Types.Input.EventData)=>{
            event.stopPropagation();
            npcSelected=false;
            selectedEnemy=mob;
            updateTargetHud();
          });
          if(elite)this.tweens.add({targets:aura,scale:1.22,alpha:.08,duration:700,yoyo:true,repeat:-1});
          if(flying)this.tweens.add({targets:root,y:y-7,duration:650+i*40,yoyo:true,repeat:-1,ease:"Sine.inOut"});
          // Enhanced idle animation with breathing, sway, and micro-movements
          // Each monster type gets unique idle behavior
          const idleOffset = i * 120;
          const isElite = elite || bossTier === "high" || bossTier === "mid";
          const isShadow = !!shadowKind;
          const isGrassElite = !!grassElite;
          
          // Base breathing animation
          this.tweens.add({
            targets: body,
            y: body.y - (flying ? 3 : 4),
            angle: flying ? 2 : (i%2 ? 1.8 : -1.8),
            scaleY: bodyBaseScaleY * (flying ? .97 : .94),
            scaleX: bodyBaseScaleX * (flying ? 1.01 : 1.005),
            duration: flying ? 360 : 260 + i * 18,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
            delay: idleOffset
          });
          
          // Secondary subtle sway for grounded monsters
          if (!flying) {
            this.tweens.add({
              targets: body,
              x: body.x + (i%2 ? 1.5 : -1.5),
              duration: 2000 + i * 100,
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              delay: idleOffset + 500
            });
          }
          
          // Elite/boss glow pulse
          if (isElite) {
            this.tweens.add({
              targets: aura,
              scale: { from: 1, to: 1.15 },
              alpha: { from: elite ? 0.3 : 0.25, to: 0.45 },
              duration: 1500 + i * 200,
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              delay: idleOffset
            });
          }
          
          // Shadow monsters: eerie float + occasional flicker
          if (isShadow) {
            this.tweens.add({
              targets: body,
              y: body.y - (flying ? 6 : 8),
              duration: 1800 + i * 150,
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              delay: idleOffset
            });
            // Random flicker
            this.time.addEvent({
              delay: Phaser.Math.Between(3000, 8000),
              loop: true,
              callback: () => {
                if (mob.alive) {
                  body.setAlpha(0.7);
                  this.tweens.add({ targets: body, alpha: 1, duration: 150, ease: "Quad.out" });
                }
              }
            });
          }
          
          // Grass elites: gentle sway like plants
          if (isGrassElite) {
            this.tweens.add({
              targets: body,
              angle: { from: -2, to: 2 },
              duration: 3000 + i * 200,
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              delay: idleOffset
            });
          }
          
          // Flying monsters: figure-8 patrol pattern
          if (flying) {
            this.tweens.add({
              targets: root,
              x: x + Phaser.Math.Between(-30, 30),
              y: y - 7 + Phaser.Math.Between(-10, 10),
              duration: Phaser.Math.Between(3000, 5000),
              yoyo: true,
              repeat: -1,
              ease: "Sine.inOut",
              delay: idleOffset
            });
          }
          // Ice soldiers telegraph their idle "red actions" with a red bar that
          // sweeps left -> right while passive. Once aggroed the tint cycles
          // yellow -> green -> white until death (handled in attack()).
          if(mob.shadowType==="ice"){
            const sweep=this.add.rectangle(-mob.actorWidth/2,-mob.actorHeight*.45,8,mob.actorHeight*.6,0xff4444,.5).setDepth(6);
            mob.root.add(sweep);
            mob.idleSweep=sweep;
            const sweepTween=this.tweens.add({targets:sweep,x:mob.actorWidth/2,duration:850,repeat:-1,ease:"Linear"});
            mob.stopIdleSweep=()=>{sweepTween.stop();sweep.destroy();mob.idleSweep=null;};
          }
          enemies.push(mob);
        });
        npcSelected=false; selectedEnemy = enemies[0];
        updateTargetHud();
      };
      const updateTargetHud=()=>{
        const panel=document.querySelector(".monster-status") as HTMLElement;
        if(npcSelected){panel.className="monster-status npc";panel.innerHTML=`<span class="monster-icon">!</span><span><b>${MAPS[map][3]} • NPC NHIỆM VỤ</b><small>Nhấn ĐÁNH để nhận chỉ dẫn khu vực</small><i><em style="width:100%"></em></i></span>`;return;}
        const mob=selectedEnemy?.alive?selectedEnemy:null;
        if(!mob){
          panel.className="monster-status empty";
          panel.innerHTML='<span class="monster-icon">?</span><span><b>CHƯA CHỌN QUÁI</b><small>Chạm vào quái để xem trạng thái</small><i><em></em></i></span>';
          return;
        }
        const percent=Math.max(0,Math.min(100,mob.hp/mob.max*100));
        panel.className=`monster-status ${mob.elite?'elite':''}`;
        const rank=mob.shadowType==='destroyer'?`Tinh anh • Dạng ${mob.form}/5`:mob.bossTier==='high'?`BOSS CAO CẤP • Hình thái ${mob.form} • 5 kỹ năng`:mob.bossTier==='mid'?'BOSS TẦM TRUNG • 4 kỹ năng':mob.elite?'Tinh anh':'Quái thường';
        panel.innerHTML=`<span class="monster-icon">${mob.bossTier==='high'?'◆':mob.elite?'★':mob.flying?'🪽':'👾'}</span><span><b>${mob.name} • Lv.${mob.lv}</b><small>${rank} • HP ${Math.max(0,mob.hp)} / ${mob.max}</small><i><em style="width:${percent}%"></em></i></span>`;
      };
      spawnPack();
      const classFx:Record<string,number>={wukong:0xffc63d,bajie:0x64d39f,wujing:0x88b8e8,tang:0xffe69a};
      const hitEffect=(enemy:any,skillNo=-1)=>{
        const color=skillNo<0?0xfff1b0:classFx[hero!.classId];
        if(skillNo<0){
          const slash=this.add.arc(enemy.root.x,enemy.root.y,38,-65,65,false,color,.85).setStrokeStyle(8,color,.95);
          this.tweens.add({targets:slash,angle:95,scale:1.35,alpha:0,duration:210,onComplete:()=>slash.destroy()});
        }else{
          const orb=this.add.circle(player.x+35,player.y-20,12,color).setStrokeStyle(4,0xffffff,.8).setDepth(8);
          const ring=this.add.circle(enemy.root.x,enemy.root.y,18,color,.25).setStrokeStyle(5,color).setDepth(7);
          this.tweens.add({targets:orb,x:enemy.root.x,y:enemy.root.y,duration:220,ease:"Quad.in",onComplete:()=>{orb.destroy();this.tweens.add({targets:ring,scale:3.2,alpha:0,duration:330,onComplete:()=>ring.destroy()});}});
          for(let p=0;p<7;p++){const spark=this.add.circle(enemy.root.x,enemy.root.y,3,color).setDepth(9);const a=(Math.PI*2*p/7);this.tweens.add({targets:spark,x:enemy.root.x+Math.cos(a)*55,y:enemy.root.y+Math.sin(a)*55,alpha:0,duration:350,onComplete:()=>spark.destroy()});}
        }
      };
      const stick = document.querySelector(".moba-stick") as HTMLElement;
      const knob = stick.querySelector("i") as HTMLElement;
      const updateStickAt = (clientX:number,clientY:number) => {
        const r=stick.getBoundingClientRect(), dx=clientX-(r.left+r.width/2), dy=clientY-(r.top+r.height/2);
        const len=Math.max(1,Math.hypot(dx,dy)), limit=30, k=Math.min(limit,len)/len;
        knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;
        moving=Math.abs(dx)>12?Math.sign(dx):0;
        if(moving){
          const nextFacing:1|-1=moving<0?-1:1;
          if(nextFacing!==heroFacing){heroFacing=nextFacing;player.scaleX=heroFacing;}
          if(heroState==="idle")playHeroMotion("run");
        }
      };
      const releaseStick=()=>{
        stickPointer=null;moving=0;knob.style.transform="translate(0,0)";
        if(heroState==="run")playHeroMotion("idle");
      };
      const touchMode=("ontouchstart" in window)||navigator.maxTouchPoints>0;
      if(touchMode){
        // Track the joystick finger at document level. Android WebView may move
        // the touch target when a second finger presses a combat button; local
        // touchmove listeners then stop receiving events and movement appears
        // to freeze. The identifier keeps both fingers completely independent.
        stick.addEventListener("touchstart",(event)=>{
          event.preventDefault();event.stopPropagation();
          if(stickPointer!==null)return;
          const touch=event.changedTouches[0];
          stickPointer=touch.identifier;updateStickAt(touch.clientX,touch.clientY);
        },{passive:false});
        document.addEventListener("touchmove",(event)=>{
          if(stickPointer===null)return;
          const touch=Array.from(event.touches).find(t=>t.identifier===stickPointer);
          if(touch){event.preventDefault();updateStickAt(touch.clientX,touch.clientY);}
        },{passive:false,capture:true});
        const endTouch=(event:TouchEvent)=>{
          if(Array.from(event.changedTouches).some(t=>t.identifier===stickPointer))releaseStick();
        };
        document.addEventListener("touchend",endTouch,{passive:false,capture:true});
        document.addEventListener("touchcancel",endTouch,{passive:false,capture:true});
      }else{
        stick.onpointerdown=(event)=>{
          event.preventDefault();event.stopPropagation();
          if(stickPointer!==null)return;
          stickPointer=event.pointerId;stick.setPointerCapture(event.pointerId);
          updateStickAt(event.clientX,event.clientY);
        };
        stick.onpointermove=(event)=>{if(event.pointerId===stickPointer)updateStickAt(event.clientX,event.clientY);};
        const endPointer=(event:PointerEvent)=>{if(event.pointerId===stickPointer)releaseStick();};
        stick.onpointerup=endPointer;stick.onpointercancel=endPointer;
      }
      // Frame-based movement stays smooth and remains active during attack,
      // skill and hurt animations. Delta caps avoid jumps after app resume.
      let changingMap=false;
      const backButton=document.querySelector(".map-back") as HTMLButtonElement;
      const nextButton=document.querySelector(".map-next") as HTMLButtonElement;
      const refreshMapGates=()=>{
        backButton.hidden=player.x>155||map===0;
        nextButton.hidden=player.x<WORLD_WIDTH-155||map>=MAPS.length-1;
      };
      const changeMap=(direction:1|-1)=>{
        if(changingMap)return;
        const next=MAPS[map+direction];
        if(!next)return;
        
        // Clean up weather particles before changing map
        [this.weatherParticles, this.snowParticles, this.mistParticles, 
         this.emberParticles, this.lightParticles, this.leafParticles,
         this.sandParticles, this.batParticles, this.sporeParticles,
         this.emberParticles2, this.divineParticles].forEach(p => {
          if(p) { p.destroy(); }
        });
        if(this.lightningTimer) { this.lightningTimer.destroy(); }
        
        changingMap=true;map+=direction;player.x=direction===1?100:WORLD_WIDTH-100;drawMap();updateNpc();spawnPack();updateMapLabel();refreshMapGates();
        log(`${direction===1?'➡':'⬅'} Đã tới ${MAPS[map][0]}`);this.time.delayedCall(350,()=>changingMap=false);
      };
      backButton.addEventListener("click",()=>changeMap(-1));
      nextButton.addEventListener("click",()=>changeMap(1));
      this.events.on("update",(_time:number,delta:number)=>{
        player.setDepth(player.y);
        npc.setDepth(npc.y);
        enemies.forEach(mob=>mob.alive&&mob.root.setDepth(mob.root.y));
        if(moving&&hero!.hp>0){
          player.x=Phaser.Math.Clamp(player.x+moving*0.34*Math.min(delta,34),70,WORLD_WIDTH-70);
          refreshMapGates();
        }
        // Parallax for mid-elements (slower than camera)
        const midElements = (this as any).midElements as Phaser.GameObjects.GameObject[];
        if(midElements){
          const camX = this.cameras.main.scrollX;
          midElements.forEach((el, idx) => {
            if(el && el.active && 'x' in el){
              const factor = 0.15 + (idx % 3) * 0.05; // Different parallax factors
              (el as any).x = ((el as any).x || 0) + (camX * factor * 0.01);
            }
          });
        }
        // Sync particle emitters to camera position
        const cam = this.cameras.main;
        const particleSystems = [this.weatherParticles, this.snowParticles, this.mistParticles, 
          this.emberParticles, this.lightParticles, this.leafParticles,
          this.sandParticles, this.batParticles, this.sporeParticles,
          this.emberParticles2, this.divineParticles];
        particleSystems.forEach((p: any) => {
          if(p && p.emitters) {
            p.emitters.list.forEach((e: any) => {
              if(e) e.setPosition(cam.scrollX + cam.width/2, cam.scrollY + cam.height/2);
            });
          }
        });
      });
      const attack = (mult = 1, skillNo = -1) => {
        if(npcSelected){
          const done=hero!.npcQuestDone!.includes(map),progress=hero!.questKills![map]||0;
          if(done){log(`✅ ${MAPS[map][3]}: Nhiệm vụ khu vực này đã hoàn thành.`);return false;}
          if(progress<5){log(`📜 ${MAPS[map][3]}: Hạ 5 quái tại ${MAPS[map][0]} (${progress}/5).`);return false;}
          const reward=makeScaledLoot(hero!.classId,"npc");reward.name=`${MAPS[map][3]} • ${reward.name}`;
          hero!.inventory!.push(reward);hero!.npcQuestDone!.push(map);persistLocalHero();
          log(`🎁 Hoàn thành nhiệm vụ! Nhận ${reward.name} +${reward.bonusPercent}% — đúng class.`);
          return false;
        }
        let enemy = selectedEnemy?.alive ? selectedEnemy : enemies.filter(e=>e.alive).sort((a,b)=>Math.abs(a.root.x-player.x)-Math.abs(b.root.x-player.x))[0];
        if (!enemy) { spawnPack(); return; }
        selectedEnemy=enemy;
        const distance=Math.abs(enemy.root.x-player.x);
        const meleeSkill=skillNo<0||(hero!.classId!=="tang"&&[0,1,4,7,8,9].includes(skillNo));
        if(meleeSkill&&distance>MELEE_RANGE){
          log(`⚠ Mục tiêu quá xa — tiến lại gần để dùng ${skillNo<0?'đánh thường':'chiêu cận chiến'}.`);
          return false;
        }
        const crit = Math.random() < hero!.crit;
        const dmg = Math.max(
          2,
          Math.floor(hero!.atk * mult * (crit ? 1.7 : 1) - enemy.lv),
        );
        enemy.hp -= dmg;
        enemy.aggro=true;
        // Ice soldier: first hit stops the red idle sweep and starts the
        // yellow -> green -> white state cycle that loops until it dies.
        if(enemy.shadowType==="ice"&&!enemy.iceCycle){
          enemy.stopIdleSweep?.();
          const iceColors=[0xffe14d,0x5eff7a,0xffffff];
          let iceIdx=0;
          enemy.iceCycle=this.time.addEvent({delay:430,loop:true,callback:()=>{iceIdx=(iceIdx+1)%3;enemy.body.setTint(iceColors[iceIdx]);}});
        }
        // Destroyer (night elite): each 20% HP lost shifts one form left->right
        // (1..5). Every form raises its damage and visibly mutates the body.
        if(enemy.shadowType==="destroyer"&&enemy.hp>0){
          const nextForm=6-Math.max(1,Math.ceil(enemy.hp/enemy.max*5));
          if(nextForm>enemy.form){
            enemy.form=nextForm;
            enemy.atkMult=1+(enemy.form-1)*.4;
            const boost=1+enemy.form*.035;
            enemy.body.setScale(enemy.bodyBaseScaleX*boost,enemy.bodyBaseScaleY*boost);
            enemy.bodyBaseScaleX=enemy.body.scaleX;enemy.bodyBaseScaleY=enemy.body.scaleY;
            enemy.body.setTint([0x9aa0b4,0xd9534f,0xff8c2b,0xc46bff,0xfff2d9][enemy.form-1]);
            this.cameras.main.flash(300,120,20,30);
            const tx=this.add.text(enemy.root.x,enemy.root.y-195,`⚙️ KẺ HỦY DIỆT BIẾN DẠNG ${enemy.form}/5 ⚙️`,{fontSize:"17px",fontStyle:"bold",color:"#ff6b5e",stroke:"#2c0738",strokeThickness:5}).setOrigin(.5).setDepth(30);
            this.tweens.add({targets:tx,y:tx.y-34,alpha:0,duration:1000,onComplete:()=>tx.destroy()});
            log(`⚠ Kẻ Hủy Diệt biến dạng lần ${enemy.form} — sát thương tăng vọt!`);
          }
        }
        if(enemy.bossTier==="high"&&enemy.form===1&&enemy.hp>0&&enemy.hp<=enemy.max*.5){
          enemy.form=2;
          enemy.body.setCrop(1625/2,0,1625/2,968).setDisplaySize(168,166);
          enemy.bodyBaseScaleX=enemy.body.scaleX;enemy.bodyBaseScaleY=enemy.body.scaleY;
          enemy.root.setSize(188,186);
          enemy.label.setText(`◆ BOSS CAO CẤP ${enemy.name.toUpperCase()} • HÌNH THÁI 2`);
          this.cameras.main.flash(420,150,55,210);
          this.cameras.main.shake(420,.015);
          const transform=this.add.text(enemy.root.x,enemy.root.y-190,"⚡ CUỒNG THỂ GIÁNG THẾ ⚡",{fontSize:"20px",fontStyle:"bold",color:"#ff91ff",stroke:"#2c0738",strokeThickness:5}).setOrigin(.5).setDepth(30);
          this.tweens.add({targets:transform,y:transform.y-35,alpha:0,duration:1100,onComplete:()=>transform.destroy()});
          log("⚠ Hoàng Mi Quái biến sang HÌNH THÁI 2 — sức mạnh tăng vọt!");
        }
        heroFacing=enemy.root.x<player.x?-1:1;
        player.scaleX=heroFacing;
        playHeroMotion(skillNo<0?"attack":"skill");
        hitEffect(enemy,skillNo);
        // Hit reaction keeps the enemy's world position/hitbox stable.
        // Phaser Shape objects (Ellipse) do not include the Tint component.
        // Calling clearTint() here threw after the first hit and stopped the
        // Scene update loop on Android, which looked exactly like frozen input.
        this.tweens.add({
          targets:enemy.body,
          scaleX:enemy.bodyBaseScaleX*(enemy.ape?.9:.84),
          scaleY:enemy.bodyBaseScaleY*(enemy.ape?1.08:.9),
          angle:enemy.ape?-7:5,
          alpha:.58,
          yoyo:true,
          duration:75,
        });
        enemy.bar.scaleX = Math.max(0, enemy.hp / enemy.max);
        enemy.hpText.setText(`${Math.max(0,enemy.hp)}/${enemy.max}`);
        updateTargetHud();
        const damageText=this.add.text(enemy.root.x,enemy.root.y-48,`${crit?'CHÍ MẠNG ':''}-${dmg}`,{fontSize:crit?"21px":"17px",fontStyle:"bold",color:crit?"#ffe15c":"#ffffff",stroke:"#6b1010",strokeThickness:4}).setOrigin(.5).setDepth(20);
        this.tweens.add({targets:damageText,y:damageText.y-38,alpha:0,duration:650,onComplete:()=>damageText.destroy()});
        log(`${crit ? "💥 CHÍ MẠNG " : ""}-${dmg} HP`);
        if (enemy.hp <= 0) {
          enemy.alive=false;
          hero!.questKills![map]=Math.min(5,(hero!.questKills![map]||0)+1);
          const gain = (12 + enemy.lv * 4) * (enemy.elite?4:1);
          hero!.exp += gain;
          hero!.gold += (8 + enemy.lv * 3) * (enemy.elite?5:1);
          if (Math.random() < (enemy.elite ? .55 : .08)) hero!.diamond += enemy.elite?2:1;
          const roll = Math.random(),
            rarity =
              roll < 0.05
                ? "🌈 Huyền thoại"
                : roll < 0.15
                  ? "🟣 Sử thi"
                  : roll < 0.4
                    ? "🔵 Hiếm"
                    : "⚪ Thường";
          log(`${enemy.elite?'👑 Hạ QUÁI TINH ANH':'Hạ '+MAPS[map][2]}: +${gain} EXP • ${rarity}`);
          const dropRoll=Math.random();
          if(enemy.elite||dropRoll<.22){
            const lootTier=enemy.bossTier==="high"?"boss-high":enemy.bossTier==="mid"?"boss-mid":"drop";
            const item=makeScaledLoot(hero!.classId,lootTier);hero!.inventory!.push(item);
            log(`🎒 Rơi ${item.name} • ${item.tier} +${item.bonusPercent}% — chỉ ${CLASSES.find(c=>c[0]===item.allowedClass)?.[1]} mặc được.`);
          }
          while (hero!.exp >= hero!.level * 100) {
            hero!.exp -= hero!.level * 100;
            hero!.level++;
            hero!.atk += 3;
            hero!.maxHp += 12;
            hero!.hp = hero!.maxHp;
            log(`⭐ LÊN CẤP ${hero!.level}!`);
          }
          persistLocalHero();
          hud();
          enemy.destroy();
          selectedEnemy=enemies.find(e=>e.alive);
          updateTargetHud();
          if(!selectedEnemy)setTimeout(spawnPack,800);
        }
        return true;
      };
      this.time.addEvent({delay:500,loop:true,callback:()=>{
        const attackers=enemies.filter(e=>e.alive&&e.aggro);
        if(!attackers.length||hero!.hp<=0)return;
        const eligible=attackers.filter(e=>{const d=Math.abs(e.root.x-player.x);return e.ranged?d>145:d<185;});
        if(!eligible.length)return;
        const mob=Phaser.Utils.Array.GetRandom(eligible);
        mob.skillClock++;
        const useBossSkill=mob.bossSkills.length>0&&mob.skillClock%(mob.bossTier==="high"?3:4)===0;
        const skillIndex=useBossSkill?Math.floor(mob.skillClock/(mob.bossTier==="high"?3:4))%mob.bossSkills.length:-1;
        const skillName=skillIndex>=0?mob.bossSkills[skillIndex]:"";
        const bossMultiplier=(mob.bossTier==="high"?(mob.form===2?3.2:2.5):mob.bossTier==="mid"?2.1:mob.elite?2:1)*(mob.atkMult||1);
        const dmg=Math.max(1,Math.floor(mob.lv*1.25-hero!.def*.35))*bossMultiplier*(useBossSkill?1.35:1);
        if(useBossSkill){
          const warning=this.add.text(mob.root.x,mob.root.y-(mob.bossTier==="high"?185:130),`⚠ ${skillName}`,{fontSize:"15px",fontStyle:"bold",color:mob.bossTier==="high"?"#ff9aff":"#ffd65a",stroke:"#250d2d",strokeThickness:4}).setOrigin(.5).setDepth(25);
          const ring=this.add.circle(player.x,player.y,26,mob.bossTier==="high"?0xb133dd:0xf08b34,.2).setStrokeStyle(5,mob.bossTier==="high"?0xff8cff:0xffd65a).setDepth(7);
          this.tweens.add({targets:[warning,ring],alpha:0,scale:2.3,duration:520,onComplete:()=>{warning.destroy();ring.destroy();}});
          log(`🔥 ${mob.name} dùng ${skillName}!`);
        }
        if(mob.ranged){
          const shot=this.add.circle(mob.root.x,mob.root.y-8,mob.elite?9:6,mob.elite?0xffd65a:0xff6655).setDepth(9);
          this.tweens.add({targets:shot,x:player.x,y:player.y-18,duration:460,onComplete:()=>shot.destroy()});
        }else if(mob.shadowType==="deer"){
          // Shadow deer: turns away from the enemy, kicks rocks backwards and
          // raises a sand burst inside a red frame.
          const dir=player.x>=mob.root.x?1:-1;
          mob.body.scaleX=-Math.abs(mob.body.scaleX)*dir;
          const frame=this.add.rectangle(mob.root.x,mob.root.y-mob.actorHeight*.5,mob.actorWidth+46,mob.actorHeight+50,0xff2222,.12).setStrokeStyle(4,0xff4444,.9).setDepth(6);
          this.tweens.add({targets:frame,alpha:0,duration:520,onComplete:()=>frame.destroy()});
          for(let k=0;k<4;k++){const rock=this.add.circle(mob.root.x+(k%2?14:-14),mob.root.y-30,6+k%3,0x8a7f72).setDepth(9);this.tweens.add({targets:rock,x:player.x+(k-1.5)*22,y:player.y-24+(k%3)*6,duration:340+k*45,onComplete:()=>rock.destroy()});}
          for(let k=0;k<10;k++){const sand=this.add.circle(mob.root.x,mob.root.y-22,2,0xe8c98a).setDepth(9);const a=Math.random()*Math.PI*2;this.tweens.add({targets:sand,x:mob.root.x+Math.cos(a)*(28+Math.random()*42),y:mob.root.y-22-Math.sin(a)*(10+Math.random()*28),alpha:0,duration:400+Math.random()*220,onComplete:()=>sand.destroy()});}
          this.tweens.add({targets:mob.body,scaleX:-Math.abs(mob.bodyBaseScaleX)*dir,duration:170,yoyo:true,onComplete:()=>{mob.body.scaleX=mob.bodyBaseScaleX;}});
        }else if(mob.shadowType==="rhino"){
          // Shadow rhino: charges forward with a blue frame under its feet.
          const dir=player.x>=mob.root.x?1:-1;
          const frame=this.add.rectangle(mob.root.x,mob.root.y+6,mob.actorWidth+30,26,0x1e5bff,.14).setStrokeStyle(4,0x2f7bff,.95).setDepth(6);
          this.tweens.add({targets:frame,alpha:0,duration:520,onComplete:()=>frame.destroy()});
          this.tweens.add({targets:mob.root,x:mob.root.x+dir*75,duration:140,yoyo:true,ease:"Quad.inOut"});
        }else if(mob.shadowType==="wolf"){
          const frame=this.add.rectangle(mob.root.x,mob.root.y-mob.actorHeight*.45,mob.actorWidth+34,mob.actorHeight*.7,0xb44dff,.1).setStrokeStyle(4,0xc46bff,.9).setDepth(6);
          this.tweens.add({targets:frame,alpha:0,duration:480,onComplete:()=>frame.destroy()});
        }else if(mob.shadowType==="panther"){
          const frame=this.add.rectangle(mob.root.x,mob.root.y-mob.actorHeight*.45,mob.actorWidth+34,mob.actorHeight*.7,0x3dff7a,.1).setStrokeStyle(4,0x5eff9a,.9).setDepth(6);
          this.tweens.add({targets:frame,alpha:0,duration:480,onComplete:()=>frame.destroy()});
          const oldX=mob.root.x;this.tweens.add({targets:mob.root,x:Math.max(player.x+65,oldX-75),duration:130,yoyo:true,ease:"Quad.inOut"});
        }else{
          const oldX=mob.root.x;this.tweens.add({targets:mob.root,x:Math.max(player.x+65,oldX-55),angle:mob.ape?-7:0,scaleY:mob.ape?.94:1,duration:150,yoyo:true,ease:"Quad.inOut"});
        }
        this.time.delayedCall(mob.ranged?430:160,()=>{
          hero!.hp=Math.max(0,hero!.hp-dmg);hud();
          playHeroMotion("hurt");
          this.cameras.main.shake(90,mob.elite ? .008 : .003);
          // Flash effect when player is hit
          this.cameras.main.flash(200, 255, 255, 255, true);
          const hurt=this.add.text(player.x,player.y-95,`-${dmg}`,{fontSize:"20px",fontStyle:"bold",color:"#ff766e",stroke:"#160b10",strokeThickness:4}).setOrigin(.5).setDepth(20);
          this.tweens.add({targets:hurt,y:hurt.y-32,alpha:0,duration:600,onComplete:()=>hurt.destroy()});
          if(hero!.hp<=0){hero!.hp=hero!.maxHp;hero!.mp=hero!.maxMp;player.x=100;log("💀 Bị hạ! Đã hồi sinh tại cổng.");hud();persistLocalHero();}
        });
      }});
      // Passive energy recovery keeps low-level combat flowing without potions.
      this.time.addEvent({delay:1000,loop:true,callback:()=>{
        if(Number(hero!.mp)<Number(hero!.maxMp)){
          hero!.mp=Math.min(Number(hero!.maxMp),Number(hero!.mp)+8);
          hud();
        }
      }});
      // Canvas taps are reserved for intentional target selection. Combat is
      // fired only by the attack/skill controls, so tapping the map, NPC or HUD
      // cannot silently switch or hit a target.
      const attackButton=document.querySelector(".attack-btn") as HTMLButtonElement;
      // pointerdown makes the action immediate on mobile and avoids the delayed
      // synthetic click/cancel interaction that can interfere with the stick.
      const bindCombatPress=(button:HTMLButtonElement,callback:()=>void)=>{
        if(touchMode){
          button.addEventListener("touchstart",event=>{
            event.preventDefault();event.stopPropagation();callback();
          },{passive:false});
        }else{
          button.onpointerdown=event=>{event.preventDefault();event.stopPropagation();callback();};
        }
      };
      bindCombatPress(attackButton,()=>attack(1));
      bindCombatPress(document.querySelector(".target-btn") as HTMLButtonElement,()=>{
        const alive=enemies.filter(e=>e.alive);
        if(npcSelected){npcSelected=false;selectedEnemy=alive[0];}
        else {const index=alive.indexOf(selectedEnemy);if(index<0||index===alive.length-1){selectedEnemy=null;npcSelected=true;}else selectedEnemy=alive[index+1];}
        updateTargetHud();
      });
      skills(attack);
      bindCombatPress(document.querySelector(".power-btn") as HTMLButtonElement,()=>{
        (document.querySelector(".combat-skill:not(.locked)") as HTMLButtonElement | null)
          ?.dispatchEvent(new Event(touchMode?"fq-cast":"pointerdown",{bubbles:true}));
      });
      hud();
      log("20 khu vực đã mở: mỗi map có 5–7 quái thường, 1 tinh anh/boss và NPC giao nhiệm vụ riêng!");
    },
  };
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 900,
    height: 520,
    parent: "game",
    backgroundColor: "#17253a",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene,
  });
  function log(s: string) {
    logs.unshift(s);
    logs.splice(20);
    document.querySelector(".feed")!.innerHTML = logs
      .map((x) => `<p>${x}</p>`)
      .join("");
  }
  function hud() {
    document.querySelector(".hud")!.innerHTML =
      `<div class="hero-status"><span class="pill identity"><b>${hero!.name}</b><small>Lv.${hero!.level}</small></span><span class="resource hp"><em>${hero!.hp}/${hero!.maxHp}</em><div class="bar"><i style="width:${(hero!.hp / hero!.maxHp) * 100}%"></i></div></span><span class="resource mp"><em>${hero!.mp}/${hero!.maxMp}</em><div class="bar"><i style="width:${(Number(hero!.mp) / Number(hero!.maxMp)) * 100}%"></i></div></span></div><div class="quick-stats"><span class="pill">⚔ ${hero!.atk}</span><span class="pill">🛡 ${hero!.def}</span><span class="pill coin">🪙 ${hero!.gold}</span><span class="pill">💎 ${hero!.diamond}</span><span class="resource exp">EXP<div class="bar"><i style="width:${(hero!.exp / (hero!.level * 100)) * 100}%"></i></div></span></div>`;
  }
  function skills(atk: (n: number, effect?: number) => boolean | void) {
    const list = SKILLS[hero!.classId];
    const keys = ["Q","W","E","R"];
    const equipped = [0,1,2,3];
    const cast = (skill: SkillDef, button: HTMLButtonElement) => {
      // Blocking system alerts pause Phaser on Android and look like a frozen
      // hero. Feedback stays on the skill orb so movement and basic attacks
      // remain available even when MP is empty.
      if (hero!.level < skill.level || Number(hero!.mp) < skill.mp) {
        const label = button.querySelector("small");
        const oldText = label?.textContent || "";
        button.classList.add("no-mp");
        if (label) label.textContent = hero!.level < skill.level ? `Cần Lv.${skill.level}` : `Thiếu ${skill.mp-Number(hero!.mp)} MP`;
        window.setTimeout(() => {
          button.classList.remove("no-mp");
          if (label) label.textContent = oldText;
        }, 650);
        return;
      }
      if(atk(skill.power,list.indexOf(skill))===false)return;
      hero!.mp = Number(hero!.mp) - skill.mp;
      hud(); persistLocalHero();
      button.disabled = true;
      button.classList.add("cooling");
      let left = skill.cd;
      const badge = button.querySelector("b")!;
      badge.textContent = String(left);
      const timer = setInterval(() => { left--; badge.textContent = left ? String(left) : keys[equipped.indexOf(list.indexOf(skill))] || "✓"; if (!left) { clearInterval(timer); button.disabled=false; button.classList.remove("cooling"); } }, 1000);
    };
    const renderEquipped = () => {
      document.querySelector(".combat-skills")!.innerHTML = equipped.map((idx,k) => { const s=list[idx]; return `<button class="combat-skill ${hero!.level<s.level?'locked':''}" ${skillIcon(hero!.classId,idx)}><b>${keys[k]}</b><span>${s.name}</span><small>${hero!.level<s.level?'Lv.'+s.level:s.mp+' MP'}</small></button>`; }).join("");
      document.querySelectorAll(".combat-skill").forEach((node,k) => {
        const b=node as HTMLButtonElement;
        const doCast=(event:Event)=>{event.preventDefault();event.stopPropagation();cast(list[equipped[k]],b);};
        if(("ontouchstart" in window)||navigator.maxTouchPoints>0){
          b.addEventListener("touchstart",doCast,{passive:false});
          b.addEventListener("fq-cast",doCast);
        }else b.addEventListener("pointerdown",doCast);
      });
    };
    document.querySelector(".skill-book")!.innerHTML = list.map((s,i) => `<button class="skill-card ${hero!.level<s.level?'locked':''}" data-skill="${i}" ${skillIcon(hero!.classId,i)}><i></i><span><b>${s.name}</b><small>${hero!.level<s.level?'🔒 Mở ở Lv.'+s.level:`${s.mp} MP • x${s.power.toFixed(1)} • ${s.cd}s`}</small></span></button>`).join("");
    document.querySelectorAll(".skill-card").forEach(b => b.addEventListener("click",()=>{ const i=Number((b as HTMLElement).dataset.skill); if(hero!.level<list[i].level)return; equipped.shift();equipped.push(i);renderEquipped(); }));
    renderEquipped();
  }
}
(async () => {
  landing();
})();
