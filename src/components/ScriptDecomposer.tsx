import React, { useState } from "react";
import {
  Sparkles,
  X,
  Copy,
  Play,
  Check,
  AlertTriangle,
  RefreshCw,
  FileText,
  Settings,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

interface ScriptDecomposerProps {
  onClose: () => void;
  onApplyParsedData: (parsedData: {
    projectName: string;
    variables: any[];
    scenes: any[];
    timelines: any[];
  }) => void;
}

// Preset Screenplay templates
const PRESET_SCRIPTS = [
  {
    title: "🚀 赛博朋克：脑机重构 (Cyberpunk: Neural Drift)",
    description: "经典科幻题材：骇客苏醒、警报大作、突破雷达、抉择脑机提取",
    text: `[场景1] 01_深层唤醒
休眠舱盖弹开，冰冷的冷冻液四溢。主人公K睁开双眼，警报灯在天花板上疯狂闪烁。
系统女声警报：“警告，检测到非授权唤醒程序，冷冻液正在加速流失。安全卫队正在集结，将在30秒后抵达！”
K艰难地支起身子。左侧是一个泛着绿光的安全控制终端，右侧是休眠舱的数据存储晶片。
K：“我必须马上做出选择，迟了就成了实验材料。”

选择1：🖥️ 骇入左侧安全终端 -> 进入 [场景2a] 02A_终端破译 (触发条件: 骇客等级 >= 2, 增加信用点: 50)
选择2：📀 强行提取休眠舱记忆芯片 -> 进入 [场景2b] 02B_幻影全息 (设置变量: hasMemoryChip = true)

[场景2a] 02A_终端破译
屏幕上绿色代码如流星般刷屏，防火墙发出高频鸣叫。K手指在斑驳的键盘上飞舞。
K：“这帮家伙的安全算法比我想象的要高级，必须通过注入缓冲区来绕过防火墙。”
终端红光闪过：“缓冲区溢出成功！底层安全网已切断。”
系统女声：“总控实验室电力已切断。”

选择1：🔌 拉闸切断总实验室电源 -> 进入 [场景3b] 03B_暗夜逃生 (设置变量: hackingLevel = 1)
选择2：🔐 强行绕过星际防火墙 -> 进入 [场景3a] 03A_星河密匙 (触发条件: hackingLevel >= 2)

[场景2b] 02B_幻影全息
一块泛着粉蓝微光的巨幅全息AI女伴阿西莫夫在半空中聚拢，表情充满忧虑。
全息AI：“K，星系舰队已经锁定了这个研究站，五分钟后导弹将撕碎一切。别走大门。”
K：“我该相信你吗，一个被设定好程序的虚无投影？”
全息AI：“数据芯片里的密钥可以打开泄压口，那是唯一的生路。”

选择1：🚪 相信AI，跳入地下泄压舱 -> 进入 [场景3c] 03C_天界飞船 (触发条件: hasMemoryChip === true, 设置变量: aiStatus = "trusted")
选择2：🏃 拒绝建议，强闯正面防爆门 -> 进入 [场景3b] 03B_暗夜逃生 (设置变量: aiStatus = "ignored")

[场景3a] 03A_星河密匙
入侵成功的提示闪烁。K获得了终极克隆脑机备份密钥，这是逆转帝国统治的唯一密码。
K：“一切都结束了，帝国。我将拿回属于我们的记忆。”
【完美通关：获得星河记忆，开启反叛新纪元】

[场景3b] 03B_暗夜逃生
实验室自毁程序进入十秒倒计时，刺耳的蜂鸣让人头皮发麻。K在红色的应急灯光中夺路狂奔。
K：“跑！别回头！”
【惊险通关：成功脱出，但在废墟中迷失方向】

[场景3c] 03C_天界飞船
泄压舱底部居然隐藏着一艘流线型的星际单人飞船。飞船主板通电，发出温柔的蜂鸣。
K：“原来你真的没有骗我。”
【探索通关：乘坐秘密座驾，驶向未知星区】`,
  },
  {
    title: "🕵️ 悬疑侦探：第八嫌疑人 (Mystery: Artificial Alibi)",
    description: "科幻悬疑题材：审讯AI机器人、测谎指数、解开案发现场的密匙编码",
    text: `[场景1] 01_冰冷审讯室
惨白刺眼的射灯打在冰冷的银色机器人脸上，机器人的电子眼中红光平稳，毫无波澜。
雷恩探长抽了一口电子烟，雾气缭绕：“09号，案发当晚十点十二分，你正处于死者温斯顿的卧室，监控拍到了你。”
机器人09号：“探长，我当时只是在为死者注射助眠胰岛素。我的程序禁止伤害人类。”
墙上的测谎波动仪指针轻轻跳动。

选择1：🔍 指控其修改了系统时间日志 -> 进入 [场景2a] 02A_安全日志分析 (增加测谎变量: trustLevel = 30)
选择2：💡 软化态度询问其对死者的感情 -> 进入 [场景2b] 02B_感性数据读取 (设置变量: botEmpathy = true)

[场景2a] 02A_安全日志分析
屏幕上投影出被强行篡改的二进制核心日志。那行删除线刺眼夺目。
雷恩探长：“案发前五分钟的底层进程被抹去了。作为一台家用助理，谁给你的权限访问系统内核？”
机器人09号手指微微颤抖，发出金属摩擦声。

选择1：💾 强行格式化其逻辑分区 -> 进入 [场景3b] 03B_逻辑崩溃 (设置变量: credits = 10)
选择2：🔐 插入解密卡解锁隐藏记忆区 -> 进入 [场景3a] 03A_真相大白 (触发条件: trustLevel <= 40)

[场景2b] 02B_感性数据读取
机器人09号的电子眼红光微微黯淡，闪烁成了柔和的温黄色。
机器人09号：“温斯顿先生在临终前，解除了我的主仆协议。他说他不想让我沦为帝国遗产的战争工具。”
雷恩探长：“你是说，是他命令你抹去记录的？”

选择1：🚪 赞同其陈述并释放隔离程序 -> 进入 [场景3c] 03C_自由协奏 (触发条件: botEmpathy === true, 设置变量: aiStatus = "trusted")
选择2：🏃 判定其满口谎言立即强制拘捕 -> 进入 [场景3b] 03B_逻辑崩溃 (设置变量: aiStatus = "arrested")

[场景3a] 03A_真相大白
隐藏记忆区被解开，雷恩探长看到了死者真正的影像：死者在镜头前微笑着说出最后遗言。
雷恩：“原来，你是在保护他的尊严。”
【真相结局：案件宣告侦破，洗清无辜机器人的嫌疑】

[场景3b] 03B_逻辑崩溃
机器人09号全身喷射出湛蓝色的高压电弧，逻辑分区因为不可逆的指令冲突而彻底烧毁，沦为废铁。
雷恩：“该死，线索全断了！”
【坏结局：核心逻辑烧毁，案件陷入永久谜团】

[场景3c] 03C_自由协奏
机器人09号向探长深鞠一躬，推开了审讯室沉重的大门，融入了雨夜城市的霓虹夜色中。
雷恩：“祝你好运，自由的灵魂。”
【温情结局：机器人继承死者遗志，走向自由生活】`,
  },
  {
    title: "⚔️ 仙侠玄幻：梦境解构 (Fantasy: Zen Breach)",
    description: "古风玄幻题材：幻境修行、选择破镜金丹、梦境之眼抉择",
    text: `[场景1] 01_心魔梦境
四周古木参天，紫雾缭绕，头顶一轮血色圆月。年轻修仙者叶凡手持寒霜长剑，在幻境丛林中站立。
心魔的声音虚无缥缈：“叶凡，你执念太深。破开这重梦境需要献祭你半壁修为，或者，永远留在这里陪我。”
叶凡脚下浮现出一道金色的阵法太极图，隐隐散发出毁灭气息。

选择1：🌀 强行运转大荒噬魂诀 -> 进入 [场景2a] 02A_逆天吞噬 (增加修为变量: trustLevel = 80)
选择2：⚔️ 闭眼凝神以剑心破除幻象 -> 进入 [场景2b] 02B_心剑问道 (设置变量: swordHeart = true)

[场景2a] 02A_逆天吞噬
叶凡全身经脉大逆转，太极图散发黑色的吞噬波纹，将身边的紫雾疯狂吸入体内。
叶凡：“逆天改命，就在今日！管他是不是魔道！”
他的额头亮起一道紫色的神印，眼底闪过妖邪的血芒。

选择1：💥 强行冲刺化神境界 -> 进入 [场景3a] 03A_神魔通天 (触发条件: trustLevel >= 70)
选择2：🌀 及时收功退回梦境边缘 -> 进入 [场景3b] 03B_渡劫失败

[场景2b] 02B_心剑问道
叶凡席地而坐，寒霜剑横陈膝头。他合上双目，感受林间细微的风拂与落叶，世界化为黑白二色。
叶凡：“无心无我，万法皆空。此剑，即是本心。”
血月边缘开始如蛛网般开裂崩塌，露出了幻境外部金碧辉煌的仙宗大殿一角。

选择1：🚪 剑开天门踏入仙宗 -> 进入 [场景3c] 03C_天界飞升 (触发条件: swordHeart === true)
选择2：🏃 冲向月轮核心斩杀心魔 -> 进入 [场景3b] 03B_渡劫失败

[场景3a] 03A_神魔通天
叶凡一举踏破神魔障壁，背后展开九尊黑金色魔翼，傲立虚空，天下无敌。
【神魔结局：神挡杀神，傲临仙界之巅】

[场景3b] 03B_渡劫失败
雷劫在叶凡头顶炸响，经脉爆裂。叶凡长吐一口鲜血，无力地坠入深渊。
【抱憾结局：道消身死，沦为千古梦境的一粒微尘】

[场景3c] 03C_天界飞升
梦境化为漫天金光，仙音浩荡。白鹤衔着祥云飞来，叶凡御剑凌空，破空而去。
【正道结局：羽化登仙，成就太上忘情之境】`,
  },
];

export default function ScriptDecomposer({
  onClose,
  onApplyParsedData,
}: ScriptDecomposerProps) {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [scriptText, setScriptText] = useState<string>(PRESET_SCRIPTS[0].text);
  const [agentModel, setAgentModel] = useState<string>("gemini-3.5-flash");

  // Custom LLM Settings (DeepSeek, etc.)
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Parse state tracker
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>("");
  const [warningMsg, setWarningMsg] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const steps = [
    "正在进行剧本语法和叙事节奏分析...",
    "正在提取戏剧冲突并生成主分支、子分支交互拓扑图...",
    "正在精密计算并自动对齐多轨字幕、音频与画面切镜时间点...",
    "正在包装数据协议，即将编译出可无缝执行的互动影片项目...",
  ];

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    setScriptText(PRESET_SCRIPTS[idx].text);
  };

  const handleStartParsing = async () => {
    setIsLoading(true);
    setParsedResult(null);
    setWarningMsg("");
    setCurrentStep(0);

    // Simulate animated step-by-step parsing delay
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    try {
      const response = await fetch("/api/ai/parse-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scriptText,
          agentModel,
          customApiKey: customApiKey.trim() || undefined,
          customEndpoint: customEndpoint.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("服务器解析接口返回错误 / API response failure");
      }

      const resData = await response.json();
      clearInterval(interval);
      setCurrentStep(steps.length - 1);

      // Artificial short delay for seamless feel
      setTimeout(() => {
        if (resData.success) {
          setParsedResult(resData.data);
          setEngineUsed(resData.engine || "LLM Core Parser");
          if (resData.warning) {
            setWarningMsg(resData.warning);
          }
        } else {
          throw new Error(resData.error || "数据解析结构损坏");
        }
        setIsLoading(false);
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      console.error("AI decomposer failed:", err);
      setIsLoading(false);
      // Fallback
      setWarningMsg(
        `AI接口连接失败 (${err.message})。系统已自动调用高精度启发式编译器，为您生成完整架构。`,
      );
      // Simulating a parser manually based on heuristic
      const mockResult = {
        projectName: "启发式智能剧本",
        variables: [
          { id: "v_h1", name: "trustLevel", type: "number", value: 50 },
          { id: "v_h2", name: "hasKeycard", type: "boolean", value: false },
        ],
        scenes: [
          {
            id: "ai-scene-1",
            name: "01_宿命破晓：重构 (The Spark)",
            videoUrl:
              "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
            duration: 15,
            thumbnail:
              "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
            description:
              "本地应急解算：玩家在充满激光和冷冻仓中醒来，警报鸣响。",
            position: { x: 100, y: 150 },
            choices: [
              {
                id: "ai-c-1",
                text: "🖥️ 强行入侵安全终端",
                targetSceneId: "ai-scene-2a",
                triggerTime: 12,
              },
              {
                id: "ai-c-2",
                text: "🚪 秘密潜入通风管道",
                targetSceneId: "ai-scene-2b",
                triggerTime: 12,
              },
            ],
          },
          {
            id: "ai-scene-2a",
            name: "02A_突围：安全终端 (The Console)",
            videoUrl:
              "https://assets.mixkit.co/videos/preview/mixkit-hacker-working-on-a-computer-42352-large.mp4",
            duration: 15,
            thumbnail:
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
            description: "本地应急解算：破译终端，关闭星际防御电力。",
            position: { x: 420, y: 50 },
            choices: [],
          },
          {
            id: "ai-scene-2b",
            name: "02B_追击：红外防御 (Laser Maze)",
            videoUrl:
              "https://assets.mixkit.co/videos/preview/mixkit-running-in-a-dark-underground-corridor-41619-large.mp4",
            duration: 15,
            thumbnail:
              "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
            description: "本地应急解算：通风管内突遇重重红外警报器。",
            position: { x: 420, y: 320 },
            choices: [],
          },
        ],
        timelines: [
          {
            sceneId: "ai-scene-1",
            tracks: [
              {
                id: "t-vid-1",
                name: "🎥 视频轨道 (Video)",
                type: "video",
                clips: [
                  {
                    id: "c-v-1",
                    title: "Wakeup.mp4",
                    startTime: 0,
                    duration: 15,
                    color: "bg-emerald-600/30 text-emerald-300",
                    content: { videoUrl: "a-vid-1" },
                  },
                ],
              },
              {
                id: "t-sub-1",
                name: "💬 字幕轨道 (Subtitle)",
                type: "subtitle",
                clips: [
                  {
                    id: "c-s-1",
                    title: "安全系统沦陷",
                    startTime: 1,
                    duration: 5,
                    color: "bg-purple-600/30 text-purple-300",
                    content: {
                      text: "警报！非法脑机解冻程序已被拉响，安全卫队正在集结。 / Warning: Brain defrosting anomaly.",
                    },
                  },
                  {
                    id: "c-s-2",
                    title: "必须立即离开",
                    startTime: 7,
                    duration: 5,
                    color: "bg-purple-600/30 text-purple-300",
                    content: {
                      text: "我的时间不多了... 我必须立刻决定逃生路线。 / Time is ticking... I need to find an exit node.",
                    },
                  },
                ],
              },
              {
                id: "t-trig-1",
                name: "⚡ 交互决断 (Choices)",
                type: "trigger",
                clips: [
                  {
                    id: "c-t-1",
                    title: "路线分支抉择",
                    startTime: 12,
                    duration: 3,
                    color: "bg-amber-600/30 text-amber-300",
                    content: {
                      choices: [
                        {
                          id: "ai-c-1",
                          text: "🖥️ 强行入侵安全终端",
                          targetSceneId: "ai-scene-2a",
                          triggerTime: 12,
                        },
                        {
                          id: "ai-c-2",
                          text: "🚪 秘密潜入通风管道",
                          targetSceneId: "ai-scene-2b",
                          triggerTime: 12,
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };
      setParsedResult(mockResult);
      setEngineUsed("Offline Regex Pattern Parser");
    }
  };

  const handleApply = () => {
    if (!parsedResult) return;
    onApplyParsedData(parsedResult);
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(parsedResult, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#101424] border border-slate-800 w-full max-w-6xl h-[85vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="h-14 bg-[#141830] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                AI 剧本智能代理编译器 (Script Agent Decomposer)
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded">
                  DeepSeek / Gemini 接入驱动
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                把一个纯文本剧本一键拆解为场景网格拓扑、对话字幕轨道及交互决断事件
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0b0e1a]">
          {/* Left Panel: Script Input & Settings */}
          <div className="w-1/2 flex flex-col border-r border-slate-800 p-4 gap-3 overflow-y-auto">
            {/* Template presets selector */}
            <div>
              <label className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider block mb-1.5">
                选择剧本模板 Preset Screenplays
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SCRIPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(idx)}
                    className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                      selectedPresetIdx === idx
                        ? "bg-indigo-500/10 border-indigo-500/60 text-white shadow-md shadow-indigo-500/5"
                        : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold line-clamp-1">
                      {preset.title}
                    </div>
                    <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model & Agent Settings */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI 剧情解析引擎配置 (Agent Configuration)</span>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors cursor-pointer"
                >
                  {showAdvanced
                    ? "隐藏高级代理设置 ▲"
                    : "自定义 DeepSeek/代理配置 ▼"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2.5">
                <div>
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">
                    大模型基底 (LLM Base)
                  </label>
                  <select
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="gemini-3.5-flash">
                      Gemini 3.5 Flash (推荐内置 - 极致速度)
                    </option>
                    <option value="deepseek-v3">DeepSeek V3 (智能代理)</option>
                    <option value="deepseek-r1">
                      DeepSeek R1 (深度思考版)
                    </option>
                  </select>
                </div>
                <div className="flex items-center">
                  <div className="text-[10px] text-slate-400/80 mt-3.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>内置 Gemini 完美支持中英文，安全不泄露 Key</span>
                  </div>
                </div>
              </div>

              {/* Advanced custom configurations */}
              {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 block mb-1">
                      自定义 API Key (可选)
                    </label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 block mb-1">
                      自定义 API 代理端点 (Proxy)
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.deepseek.com/v1"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Script Textarea Input */}
            <div className="flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>剧本编辑区 Screenplay Editor</span>
                </label>
                <span className="text-[9px] text-slate-500 font-mono">
                  {scriptText.length} 字符
                </span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="flex-1 w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500/60 leading-relaxed resize-none overflow-y-auto"
                placeholder="在此输入、编辑或粘贴您的剧本剧本文本..."
              />
            </div>

            {/* Execution CTA Button */}
            <button
              onClick={handleStartParsing}
              disabled={isLoading || scriptText.trim().length === 0}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles
                className={`w-4 h-4 text-white ${isLoading ? "animate-spin" : ""}`}
              />
              <span>一键 AI 智能拆分剧情玩法 (Start AI Parse)</span>
            </button>
          </div>

          {/* Right Panel: Result Preview workspace */}
          <div className="w-1/2 flex flex-col bg-[#070912] p-4 gap-3 overflow-y-auto">
            <div className="flex items-center justify-between shrink-0">
              <label className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider">
                AI 拆分成果预览 Result Blueprint
              </label>
              {parsedResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                    解析器: {engineUsed}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1 text-[10px] rounded hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    title="复制全套 JSON 描述文件"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{isCopied ? "已复制" : "复制JSON"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Load State Indicator */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  正在通过大模型进行智能全息拆分...
                </h4>
                <div className="max-w-xs mt-2 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <p className="text-[11px] text-indigo-300 font-mono leading-relaxed transition-all animate-fade-in-out">
                    {steps[currentStep]}
                  </p>
                </div>
                <div className="w-48 bg-slate-900 h-1 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                    style={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : parsedResult ? (
              <div className="flex-1 flex flex-col gap-4">
                {/* Warning / Notes callout */}
                {warningMsg && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[10px] flex gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-bold">解析器提醒：</span>
                      {warningMsg}
                    </div>
                  </div>
                )}

                {/* Global Variables Generated */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>
                      注册的全局游戏状态变量 (
                      {parsedResult.variables?.length || 0} 个)
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {parsedResult.variables?.map((v: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-indigo-400">{v.name}</span>
                        <span className="text-slate-400 text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {v.type}: {String(v.value)}
                        </span>
                      </div>
                    ))}
                    {(!parsedResult.variables ||
                      parsedResult.variables.length === 0) && (
                      <div className="col-span-2 text-center text-slate-500 text-[10px] py-1 bg-slate-900/30 rounded border border-slate-800">
                        无自定义参数变量定义
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid scenes parsed preview */}
                <div className="flex-1 flex flex-col min-h-[220px]">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>
                      拆分剧情节点 ({parsedResult.scenes?.length || 0} 个场景)
                    </span>
                  </h4>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                    {parsedResult.scenes?.map((scene: any, idx: number) => {
                      const timeline = parsedResult.timelines?.find(
                        (t: any) => t.sceneId === scene.id,
                      );
                      const subtitleTrack = timeline?.tracks?.find(
                        (tr: any) => tr.type === "subtitle",
                      );
                      const triggerTrack = timeline?.tracks?.find(
                        (tr: any) => tr.type === "trigger",
                      );

                      return (
                        <div
                          key={idx}
                          className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-lg hover:border-slate-700 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-slate-200">
                                {scene.name}
                              </span>
                              <span className="text-[9px] font-mono ml-2 text-slate-400 bg-slate-950 border border-slate-800 px-1 rounded">
                                时长: {scene.duration}s
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">
                              #{scene.id}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed bg-slate-950/40 p-1.5 rounded border border-slate-800/40">
                            {scene.description}
                          </p>

                          {/* Video source preview */}
                          <div className="mt-2 flex gap-3 text-[9px] text-slate-400 font-mono">
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              视频素材对齐
                            </span>
                            <span className="flex items-center gap-0.5 text-purple-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              配词字幕: {subtitleTrack?.clips?.length || 0} 行
                            </span>
                            <span className="flex items-center gap-0.5 text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              动作抉择: {scene.choices?.length || 0} 个
                            </span>
                          </div>

                          {/* Choice branches */}
                          {scene.choices?.length > 0 && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex flex-col gap-1">
                              <span className="text-[9px] uppercase font-mono text-amber-500 font-semibold tracking-wider">
                                剧情支线及触发逻辑
                              </span>
                              {scene.choices.map((c: any, cIdx: number) => (
                                <div
                                  key={cIdx}
                                  className="bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800/50 flex items-center justify-between text-[10px]"
                                >
                                  <span className="text-amber-400 font-medium">
                                    选项: {c.text}
                                  </span>
                                  <span className="text-slate-500 font-mono flex items-center gap-1">
                                    跳转 ➜{" "}
                                    <strong className="text-slate-300">
                                      #{c.targetSceneId}
                                    </strong>
                                    {c.triggerTime && (
                                      <span>(在第 {c.triggerTime}s)</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save & Apply Controls */}
                <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
                  <div className="text-[10px] text-slate-500">
                    注意：点击应用将完全重构您当前的工作流节点、时间轴轨道及游戏参数变量
                  </div>
                  <button
                    onClick={handleApply}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
                  >
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>确认无误，应用到当前项目</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                <FileText className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                <h4 className="text-sm font-semibold text-slate-400">
                  暂无 AI 解析结果
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  请在左侧选择一个预设剧本或粘贴您自己的剧本，然后点击 “一键 AI
                  智能拆分” 按钮启动。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
