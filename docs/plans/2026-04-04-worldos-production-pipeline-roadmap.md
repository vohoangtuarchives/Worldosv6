# WorldOS Production Pipeline Roadmap

## Muc tieu

Hoan thien mot chuoi san xuat tu dong de WorldOS co the tao ra san pham cuoi ro rang va lap lai duoc:

`Simulation -> Material Civilization -> Culture / Religion / Myth -> History -> Narrative / Loom -> Publishing`

San pham cuoi can dat duoc 5 dau ra:

1. `Civilization dossier`: ho so nen van minh theo vung, vat chat, nghe nghiep, niem tin, cau truc xa hoi.
2. `Universe history`: lich su duoc bien soan theo thoi ky, bien co, rise/fall, migration, conflict.
3. `Actor biography`: con nguoi co nghe, tang lop, que quan, tinh nguong, bien co doi song.
4. `Narrative artifact`: chronicle, omen, myth, chapter, series.
5. `Publishing output`: timeline, codex, feed, dashboard, export API.

## Nguyen tac thiet ke

1. `Simulation` la critical path, khong duoc sap vi AI.
2. `Narrative` va `Loom` la augmentation layer, phai degrade gracefully.
3. `Material life` phai co truoc `Culture`.
4. `Culture / Myth / Religion` phai moc len tu doi song vat chat va lich su.
5. `History` khong chi la log; phai la tong hop co nhan qua.
6. Moi workstream phai sinh ra artifact de nguoi dung nhin thay duoc.

## Hien trang

### Da co

- Simulation tick pipeline va world kernel.
- Material/economy/politics/trade/civilization engines co ban.
- Narrative pulse trong tick loop.
- Loom intent sampling cho actor.
- Chronicle, narrative, history, mythology, religion, series da co skeleton service/job.

### Chua day du

- Material world chua tao ra doi song vat chat day du.
- Simulation-core culture engine con dang stub.
- ReligionGenerator va MythologyEngine con rong.
- HistoryEngine moi doc timeline, chua synthesis.
- Weave/publishing chua duoc orchestration tu dong theo window.
- Artifact layer chua day du: dossier, codex, chapter pipeline, civilization memory spine.

## Tam nhin san pham cuoi

Mot universe chay on dinh phai tu dong sinh ra:

- `Zone identity`: moi vung co tai nguyen, vat lieu, kieu sinh ke, settlement pattern rieng.
- `Civilization identity`: moi nen van minh co kinh te, van hoa, my hoc, tap tuc, niem tin rieng.
- `Historical memory`: co founding event, sacred trauma, golden age, migration, collapse/rebirth.
- `Human stories`: actor co nghe nghiep, que quan, tang lop, tinh nguong, su nghiep.
- `Narrative outputs`: chronicle, omen, chapter, series, world report.

## Lo trinh thuc hien

## Phase 1 - Platform and Reliability Foundation

### Muc tieu

On dinh AI runtime va queue de chuoi san xuat khong bi dut.

### Deliverables

- AiGateway on dinh voi pool key lifecycle.
- Logging / health / status cho simulation, narrative, loom, worker.
- Tach ro critical path va async path.
- Narrative / loom fail khong duoc lam sap tick.

### Tasks

#### 1.1 AI runtime hardening

- Chuan hoa env cho backend / worker / scheduler.
- Chuan hoa key pool status lifecycle: `active`, `inactive`, `cooldown`.
- Them log `started/completed/failed/skipped` cho narrative va loom.
- Dam bao `No available AI key` khong lam do tick loop toan he thong.

#### 1.2 Queue and orchestration

- Tach queue `simulation`, `narrative`, `loom`, `publishing`.
- Dat retry / timeout / cooldown ro rang cho tung loai job.
- Them observer metrics:
  - tick latency
  - narrative pulse success rate
  - loom request success rate
  - queued job backlog

#### 1.3 Gatekeeping and degradation

- Neu AI fail: fallback deterministic, khong collapse simulation.
- Neu weave fail: log warning va bo qua publishing tick do.
- Neu loom intent fail: actor quay ve deterministic decision engine.

### Definition of done

- Tick chay on dinh duoi tai.
- Narrative / loom loi nhung simulation van tiep tuc.
- Co the doc log de biet luong nao dang chay, luong nao dang fail.

## Phase 2 - Material Civilization Foundation

### Muc tieu

Bien tai nguyen va vat lieu thanh doi song vat chat thuc su.

### Deliverables

- `Zone material profile`
- `Settlement / livelihood profile`
- `Production chain` va `tooling layer`
- `Material identity` cho civilization

### Tasks

#### 2.1 Zone material profile

- Bo sung profile cho moi zone:
  - climate
  - water access
  - flora / fauna
  - minerals
  - fuel
  - dominant materials
- Luu profile vao world state / civilization state.

#### 2.2 Material to livelihood

- Mapping tu material profile sang:
  - food system
  - shelter type
  - tool type
  - primary occupation
  - trade goods
- Tao `material constraints` anh huong len growth, mobility, risk, settlement.

#### 2.3 Material to architecture and economy

- Xac dinh kieu settlement:
  - nomadic
  - river village
  - fortified hill town
  - maritime port
  - mining outpost
- Noi material profile vao market / trade / politics.

### Definition of done

- Moi zone / civilization co material signature de phan biet.
- Artifact UI/API co the tra ve profile vat chat cua world.

## Phase 3 - Culture and Human Identity

### Muc tieu

Chuyen doi song vat chat thanh ban sac van hoa va doi song con nguoi.

### Deliverables

- `Culture profile`
- `Occupation / class / household profile`
- `Language / custom / taboo / aesthetics`
- `Actor material biography`

### Tasks

#### 3.1 Culture synthesis

- Nang actor-level culture vector thanh artifact:
  - customs
  - rituals
  - aesthetics
  - taboo
  - collectivism style
- Hoan thien simulation-core culture engine thay vi stub.

#### 3.2 Human material identity

- Bo sung cho actor:
  - occupation
  - class / role
  - settlement origin
  - household type
  - faith alignment
  - personal tools / possessions

#### 3.3 Cultural grouping

- Gom actor thanh culture groups theo:
  - livelihood
  - meme profile
  - region
  - language drift
- Sinh `culture dossier` cho tung group.

### Definition of done

- Actor khong chi co traits, ma co identity de ke chuyen.
- Civilization co phong tuc / my hoc / cach song khac nhau.

## Phase 4 - Myth, Religion, Symbolic Systems

### Muc tieu

De tôn giao va than thoai moc len tu lich su va doi song vat chat, khong spawn ngau nhien.

### Deliverables

- `Myth seed`
- `Religion seed`
- `Ritual / doctrine / taboo / sacred symbol`
- `Faith spread and institutionalization`

### Tasks

#### 4.1 Mythogenesis completion

- Map chronicle / event types thanh myth seeds:
  - famine
  - flood
  - war
  - migration
  - celestial anomaly
  - founder event
- Hoan thien MythologyEngine de sinh:
  - myth title
  - myth motif
  - sacred enemies
  - archetypal meaning

#### 4.2 Religion generation

- Hoan thien ReligionGenerator:
  - detect myth du dieu kien thanh faith
  - generate doctrine, ritual, sacred object, social function
- Gan faith vao actor / civilization / institution.

#### 4.3 Social consequences

- Religion anh huong len:
  - legitimacy
  - conflict
  - taboo
  - cohesion
  - law and governance

### Definition of done

- Moi religion co nguon goc nhan qua.
- Co the xem codex cho myth / religion qua API/UI.

## Phase 5 - History Synthesis and Memory Spine

### Muc tieu

Bien chronicle va event thanh lich su duoc bien soan va truy van duoc.

### Deliverables

- `Universe historical spine`
- `Civilization history`
- `Great person legacy`
- `Historical scars`
- `Complete history book`

### Tasks

#### 5.1 Timeline to synthesis

- Nang HistoryEngine tu timeline reader thanh synthesis engine.
- Xac dinh major epochs:
  - genesis
  - rise
  - expansion
  - fracture
  - collapse
  - rebirth

#### 5.2 Memory spine

- Sinh cho moi civilization:
  - founding event
  - sacred trauma
  - migration route
  - golden age
  - ancestral enemy
  - collapse memory

#### 5.3 History artifacts

- Tao:
  - civilization dossier
  - universe history
  - actor legacy summary
  - timeline by importance

### Definition of done

- Nguoi dung co the doc lich su va nhin ra nhan qua, khong chi thay raw logs.

## Phase 6 - Narrative, Loom, and Publishing Automation

### Muc tieu

Khiep kin chuoi san xuat thanh artifact co the xuat ban.

### Deliverables

- `Auto weave orchestration`
- `Chapter generation`
- `Series / saga generation`
- `World report / news feed`
- `Publishing API / dashboard`

### Tasks

#### 6.1 Auto weave orchestrator

- Khi `NarrativeEngine` pulse dat nguong, dispatch async weave job.
- Dung cooldown / window:
  - moi 10-20 tick
  - hoac khi event severity cao
  - hoac state delta vuot nguong

#### 6.2 Story assembly

- raw chronicle -> woven chronicle
- woven chronicle -> chapter
- chapter -> saga / series
- update myth / religion / civilization codex song song

#### 6.3 Publishing surfaces

- API cho:
  - timeline
  - civilization dossier
  - religion codex
  - universe history
  - chapter / series feed
- Frontend:
  - observer timeline
  - civilization explorer
  - actor story view
  - world report panel

### Definition of done

- He thong co the tao chapter / report tu dong ma khong can trigger tay.

## Workstreams

### Workstream A - Platform and Reliability

- AI runtime
- queue
- logging
- health checks
- fallback and cooldown

### Workstream B - Material World

- zone profile
- materials
- tools
- production
- settlement
- architecture

### Workstream C - Culture and Human Systems

- culture synthesis
- social identity
- occupation and class
- language and customs

### Workstream D - Myth and Religion

- myth seed
- religion seed
- ritual systems
- doctrinal effects

### Workstream E - History and Memory

- chronicle synthesis
- historical spines
- scars and legacies
- world history generation

### Workstream F - Narrative and Publishing

- pulse orchestration
- weave orchestration
- chapter and series generation
- feed and export

## Thu tu uu tien

1. Phase 1 - Platform and Reliability
2. Phase 2 - Material Civilization Foundation
3. Phase 3 - Culture and Human Identity
4. Phase 4 - Myth, Religion, Symbolic Systems
5. Phase 5 - History Synthesis and Memory Spine
6. Phase 6 - Narrative, Loom, and Publishing Automation

## Tranche ship khuyen nghi

### Tranche 1

`Platform + Material identity + Narrative observability`

Muc tieu:

- He thong on dinh
- zone / civilization bat dau co material signature
- log / metrics ro rang cho narrative va loom

### Tranche 2

`Culture + human identity`

Muc tieu:

- civilization co custom / role / social identity
- actor co profile doi song

### Tranche 3

`Myth + religion + history synthesis`

Muc tieu:

- the gioi bat dau co tri nho, bieu tuong, niem tin

### Tranche 4

`Auto weave + chapter + publishing`

Muc tieu:

- tu simulation ra san pham cuoi co the doc / xem / xuat ban

## Definition of done cho chuoi san xuat hoan chinh

Chuoi duoc xem la hoan chinh khi mot universe co the tu dong sinh ra:

- it nhat 3 civilization co identity khac nhau
- it nhat 2 tradition myth / religion co nguon goc hop ly
- actor biographies co nghe, faith, class, milestones
- lich su theo era co rise/fall, war, migration, trauma
- chronicle / chapter / report duoc tao theo window tu dong
- dashboard / API hien thi duoc cac artifact tren

## Tranche 1 task board

### Task group A - reliability

- [ ] Chuan hoa worker queues va timeout/retry policy
- [ ] Them logging `started/completed/failed/skipped` day du cho narrative and loom
- [ ] Them health summary cho AI runtime va queue backlog

### Task group B - material identity

- [ ] Tao `zone material profile` trong world state
- [ ] Mapping material profile -> livelihood / settlement type
- [ ] Gan material profile vao civilization aggregation output

### Task group C - artifact visibility

- [ ] Tao read model / API cho civilization dossier can ban
- [ ] Hien thi material signature tren dashboard
- [ ] Ghi chronicle cho major material / settlement transitions

## Risks can quan ly

- Spam AI call neu weave khong co throttle.
- Simulation path bi block neu narrative/loom bi dat trong critical path.
- Culture / religion khong co logic nhan qua se tao cam giac "random lore".
- Artifact output nghe hay nhung khong phan anh state that neu khong buoc chat voi material / history.

## Cach do tien do

### Metrics ky thuat

- tick latency
- narrative pulse success rate
- loom success rate
- queue delay
- artifact generation rate

### Metrics san pham

- civilization uniqueness score
- history density per 100 ticks
- myth / religion emergence rate
- actor biography richness
- woven chapter coverage

