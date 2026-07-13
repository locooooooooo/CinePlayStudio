import {
  SceneNode,
  MediaAsset,
  EditorPlugin,
  ProjectVariable,
  TimelineTrack,
} from "./types";

export const INITIAL_VARIABLES: ProjectVariable[] = [
  { id: "v1", name: "hackingLevel", type: "number", value: 1 },
  { id: "v2", name: "hasMemoryChip", type: "boolean", value: false },
  { id: "v3", name: "credits", type: "number", value: 100 },
  { id: "v4", name: "aiStatus", type: "string", value: "offline" },
];

export const INITIAL_ASSETS: MediaAsset[] = [
  // Videos
  {
    id: "a-vid-1",
    name: "01_Cyberpunk_Lab_Wakeup.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4", // Cyber-feeling
    duration: 15,
    thumbnail:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
    size: "18.4 MB",
    category: "Scene Video",
  },
  {
    id: "a-vid-2",
    name: "02_Terminal_Hacking.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hacker-working-on-a-computer-42352-large.mp4", // Coding
    duration: 18,
    thumbnail:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
    size: "22.1 MB",
    category: "Scene Video",
  },
  {
    id: "a-vid-3",
    name: "03_Hologram_AI_Warning.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-portrait-of-a-woman-40618-large.mp4", // Hologram
    duration: 20,
    thumbnail:
      "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=300&q=80",
    size: "25.6 MB",
    category: "Scene Video",
  },
  {
    id: "a-vid-4",
    name: "04_Blackout_Escape.mp4",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-running-in-a-dark-underground-corridor-41619-large.mp4", // Dark corridor
    duration: 12,
    thumbnail:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
    size: "14.0 MB",
    category: "Scene Video",
  },

  // Audios
  {
    id: "a-aud-1",
    name: "Cyber_Ambient_Pad.wav",
    type: "audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 45,
    thumbnail:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    size: "4.2 MB",
    category: "Sound Effects",
  },
  {
    id: "a-aud-2",
    name: "Access_Denied_Sfx.mp3",
    type: "audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 3,
    thumbnail:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    size: "280 KB",
    category: "UI SFX",
  },
  {
    id: "a-aud-3",
    name: "Hologram_Whirring.wav",
    type: "audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    size: "1.1 MB",
    category: "Atmosphere",
  },
];

export const INITIAL_PLUGINS: EditorPlugin[] = [
  {
    id: "p-qte",
    name: "QTE Quick-Time Action (QTE动作按键)",
    description:
      "在特定时间生成需要玩家快速点击按键的交互事件，可自定义按键与限时。",
    version: "1.2.0",
    author: "InteractiveLab",
    isActive: true,
    type: "overlay",
    iconName: "Zap",
    code: `// QTE Interaction System Script
// Available parameters: keyTrigger (string), timeLimit (number), successReward (object)
function onRegister(editorAPI) {
  editorAPI.registerTrackType('QTE_Action_Track');
  console.log("QTE Action Track registered successfully.");
}

function onTrigger(timestamp, config, variables, updateVariable) {
  // Returns state description for UI overlay rendering
  return {
    type: "QTE",
    key: config.keyTrigger || "SPACE",
    limit: config.timeLimit || 2.0,
    startTime: timestamp,
    onSuccess: () => {
      updateVariable("hackingLevel", (val) => val + 1);
      editorAPI.notify("QTE成功！骇客等级已提升！");
    },
    onFail: () => {
      editorAPI.notify("QTE失败...警报已被拉响！");
    }
  };
}`,
  },
  {
    id: "p-stat-hud",
    name: "Status Variables HUD (角色属性看板)",
    description:
      "在播放器顶部常驻一个半透明面板，动态显示玩家的金币、黑客等级、装备状态等。",
    version: "1.0.4",
    author: "CineEngine",
    isActive: true,
    type: "widget",
    iconName: "LayoutDashboard",
    code: `// Variable Display Plugin
function onRender(variables) {
  return [
    { label: "⚡ 骇客等级", value: variables.hackingLevel },
    { label: "💳 信用点", value: variables.credits + " CR" },
    { label: "💾 记忆芯片", value: variables.hasMemoryChip ? "已获取" : "未获取" }
  ];
}`,
  },
  {
    id: "p-sub-stylizer",
    name: "Cinema Subtitle Stylizer (电影级艺术字幕)",
    description:
      "提供电影级别的双语字幕渲染效果，支持炫酷的渐变、边框以及特效底板。",
    version: "2.1.1",
    author: "FontWizard",
    isActive: false,
    type: "overlay",
    iconName: "Type",
    code: `// Dynamic Cinema Subtitles Renderer
function renderSubtitles(textCn, textEn) {
  return {
    cnStyle: "text-amber-400 font-bold tracking-wider text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
    enStyle: "text-slate-100 font-mono tracking-normal text-sm opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
    containerBg: "bg-black/50 backdrop-blur-xs px-4 py-2 rounded-lg border border-white/10"
  };
}`,
  },
];

export const INITIAL_SCENES: SceneNode[] = [
  {
    id: "scene-1",
    name: "01_宿命觉醒 (Wake Up)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
    duration: 15,
    thumbnail:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
    description:
      "主角在赛博实验室的冬眠舱内醒来，警报声大作。需要做出最初的选择。",
    position: { x: 80, y: 150 },
    choices: [
      {
        id: "c1-1",
        text: "🖥️ 骇入左侧安全终端",
        targetSceneId: "scene-2a",
        triggerTime: 12,
        actionCode: "variables.hackingLevel = 2;",
      },
      {
        id: "c1-2",
        text: "📀 提取休眠舱记忆芯片",
        targetSceneId: "scene-2b",
        triggerTime: 12,
        actionCode: "variables.hasMemoryChip = true;",
      },
    ],
  },
  {
    id: "scene-2a",
    name: "02A_终端骇入 (Console Hack)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-hacker-working-on-a-computer-42352-large.mp4",
    duration: 18,
    thumbnail:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
    description:
      "终端上跳出密密麻麻的代码。如果拥有高等级骇客技术，可解锁特殊路径。",
    position: { x: 420, y: 50 },
    choices: [
      {
        id: "c2a-1",
        text: "🔐 强行绕过安全防火墙",
        targetSceneId: "scene-3a",
        triggerTime: 15,
        condition: "hackingLevel >= 2",
        actionCode: "variables.credits += 50;",
      },
      {
        id: "c2a-2",
        text: "🔌 拉闸切断总实验室电源",
        targetSceneId: "scene-3b",
        triggerTime: 15,
        actionCode: "variables.hackingLevel = 1;",
      },
    ],
  },
  {
    id: "scene-2b",
    name: "02B_幻影警告 (Hologram AI)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-portrait-of-a-woman-40618-large.mp4",
    duration: 20,
    thumbnail:
      "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=300&q=80",
    description: "激活了AI全息投影，人工智能发出避难警告，指引隐秘舱口。",
    position: { x: 420, y: 320 },
    choices: [
      {
        id: "c2b-1",
        text: "🚪 信任AI，进入地下泄压舱",
        targetSceneId: "scene-3c",
        triggerTime: 16,
        condition: "hasMemoryChip === true",
        actionCode: 'variables.aiStatus = "trusted";',
      },
      {
        id: "c2b-2",
        text: "🏃 拒绝建议，直接逃离实验室",
        targetSceneId: "scene-3b",
        triggerTime: 16,
        actionCode: 'variables.aiStatus = "ignored";',
      },
    ],
  },
  {
    id: "scene-3a",
    name: "03A_核心服务器 (Core Server)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80",
    description: "成功入侵终极服务器，获得所有星际航线图！【完美结局】",
    position: { x: 760, y: 30 },
    choices: [],
  },
  {
    id: "scene-3b",
    name: "03B_黑暗逃亡 (Escape Chase)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-running-in-a-dark-underground-corridor-41619-large.mp4",
    duration: 12,
    thumbnail:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
    description:
      "在无边黑暗中奔跑，实验室自毁程序倒计时，背水一战。【惊险结局】",
    position: { x: 760, y: 190 },
    choices: [],
  },
  {
    id: "scene-3c",
    name: "03C_秘密舱口 (Secret Hatch)",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44026-large.mp4",
    duration: 10,
    thumbnail:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=300&q=80",
    description: "进入了秘密逃生舱，竟然直达星际飞船的主控台！【探索结局】",
    position: { x: 760, y: 360 },
    choices: [],
  },
];

// Initial timeline layout for Scene 1 (The Wakeup Scene)
export const INITIAL_TIMELINES_BY_SCENE: Record<string, TimelineTrack[]> = {
  "scene-1": [
    {
      id: "t-vid",
      name: "🎥 视频轨道 (Video)",
      type: "video",
      clips: [
        {
          id: "clip-v1",
          title: "01_Cyberpunk_Lab_Wakeup.mp4",
          startTime: 0,
          duration: 15,
          color:
            "bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500 text-emerald-300",
          content: { videoUrl: "a-vid-1" },
        },
      ],
    },
    {
      id: "t-aud",
      name: "🔊 音频轨道 (Audio)",
      type: "audio",
      clips: [
        {
          id: "clip-a1",
          title: "Cyber_Ambient_Pad.wav",
          startTime: 0,
          duration: 15,
          color:
            "bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-500 text-indigo-300",
          content: { volume: 80 },
        },
      ],
    },
    {
      id: "t-sub",
      name: "💬 字幕轨道 (Subtitle)",
      type: "subtitle",
      clips: [
        {
          id: "clip-s1",
          title: "警报！系统出现未知入侵 (System Breach!)",
          startTime: 1,
          duration: 4,
          color:
            "bg-purple-600/30 hover:bg-purple-600/40 border-purple-500 text-purple-300",
          content: {
            text: "警报！系统检测到非正常唤醒程序。 / Warning! Unauthorized wake-up detected.",
          },
        },
        {
          id: "clip-s2",
          title: "我必须找到控制终端 (Need to find terminal)",
          startTime: 6,
          duration: 5,
          color:
            "bg-purple-600/30 hover:bg-purple-600/40 border-purple-500 text-purple-300",
          content: {
            text: "休眠程序在流失...我要在备用电源耗尽前接管。 / Cryo fluids are leaking... I need to breach the core.",
          },
        },
      ],
    },
    {
      id: "t-trig",
      name: "⚡ 交互决断 (Interactive Choices)",
      type: "trigger",
      clips: [
        {
          id: "clip-t1",
          title: "抉择点：骇终端 vs 取芯片",
          startTime: 12,
          duration: 3,
          color:
            "bg-amber-600/30 hover:bg-amber-600/40 border-amber-500 text-amber-300",
          content: {
            choices: [
              {
                id: "c1-1",
                text: "🖥️ 骇入左侧安全终端",
                targetSceneId: "scene-2a",
                triggerTime: 12,
                actionCode: "variables.hackingLevel = 2;",
              },
              {
                id: "c1-2",
                text: "📀 提取休眠舱记忆芯片",
                targetSceneId: "scene-2b",
                triggerTime: 12,
                actionCode: "variables.hasMemoryChip = true;",
              },
            ],
          },
        },
      ],
    },
    {
      id: "t-plug",
      name: "🧩 插件通道 (QTE / HUD Overlay)",
      type: "plugin",
      clips: [
        {
          id: "clip-p1",
          title: "QTE: 紧急激活防爆仓门 (Press [SPACE])",
          startTime: 4.5,
          duration: 1.5,
          color:
            "bg-rose-600/30 hover:bg-rose-600/40 border-rose-500 text-rose-300",
          content: {
            pluginId: "p-qte",
            pluginConfig: {
              keyTrigger: "SPACE",
              timeLimit: 1.5,
            },
          },
        },
      ],
    },
  ],
  "scene-2a": [
    {
      id: "t-vid-2a",
      name: "🎥 视频轨道 (Video)",
      type: "video",
      clips: [
        {
          id: "clip-v2a",
          title: "02_Terminal_Hacking.mp4",
          startTime: 0,
          duration: 18,
          color:
            "bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500 text-emerald-300",
          content: { videoUrl: "a-vid-2" },
        },
      ],
    },
    {
      id: "t-sub-2a",
      name: "💬 字幕轨道 (Subtitle)",
      type: "subtitle",
      clips: [
        {
          id: "clip-s2a-1",
          title: "安全防火墙正在解析 (Firewall Parsing)",
          startTime: 1,
          duration: 5,
          color:
            "bg-purple-600/30 hover:bg-purple-600/40 border-purple-500 text-purple-300",
          content: {
            text: "防火墙层级极高... 正常情况下需要解密卡。 / Firewall trace active... decryption card requested.",
          },
        },
      ],
    },
    {
      id: "t-trig-2a",
      name: "⚡ 交互决断 (Interactive Choices)",
      type: "trigger",
      clips: [
        {
          id: "clip-t2a",
          title: "抉择：防火墙骇入 vs 拉闸断电",
          startTime: 15,
          duration: 3,
          color:
            "bg-amber-600/30 hover:bg-amber-600/40 border-amber-500 text-amber-300",
          content: {
            choices: [
              {
                id: "c2a-1",
                text: "🔐 强行绕过安全防火墙",
                targetSceneId: "scene-3a",
                triggerTime: 15,
                condition: "hackingLevel >= 2",
                actionCode: "variables.credits += 50;",
              },
              {
                id: "c2a-2",
                text: "🔌 拉闸切断总实验室电源",
                targetSceneId: "scene-3b",
                triggerTime: 15,
                actionCode: "variables.hackingLevel = 1;",
              },
            ],
          },
        },
      ],
    },
  ],
  "scene-2b": [
    {
      id: "t-vid-2b",
      name: "🎥 视频轨道 (Video)",
      type: "video",
      clips: [
        {
          id: "clip-v2b",
          title: "03_Hologram_AI_Warning.mp4",
          startTime: 0,
          duration: 20,
          color:
            "bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500 text-emerald-300",
          content: { videoUrl: "a-vid-3" },
        },
      ],
    },
    {
      id: "t-aud-2b",
      name: "🔊 音频轨道 (Audio)",
      type: "audio",
      clips: [
        {
          id: "clip-a2b",
          title: "Hologram_Whirring.wav",
          startTime: 0,
          duration: 10,
          color:
            "bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-500 text-indigo-300",
          content: { volume: 90 },
        },
      ],
    },
    {
      id: "t-sub-2b",
      name: "💬 字幕轨道 (Subtitle)",
      type: "subtitle",
      clips: [
        {
          id: "clip-s2b-1",
          title: "你好，幸存者。(Greetings, Survivor.)",
          startTime: 1,
          duration: 6,
          color:
            "bg-purple-600/30 hover:bg-purple-600/40 border-purple-500 text-purple-300",
          content: {
            text: "我是AI阿西莫夫。检测到星系舰队已发射了导弹。 / I am AI Asimov. Planetary missile trajectory locked.",
          },
        },
      ],
    },
    {
      id: "t-trig-2b",
      name: "⚡ 交互决断 (Interactive Choices)",
      type: "trigger",
      clips: [
        {
          id: "clip-t2b",
          title: "抉择：信任AI vs 拒绝强突",
          startTime: 16,
          duration: 4,
          color:
            "bg-amber-600/30 hover:bg-amber-600/40 border-amber-500 text-amber-300",
          content: {
            choices: [
              {
                id: "c2b-1",
                text: "🚪 信任AI，进入地下泄压舱",
                targetSceneId: "scene-3c",
                triggerTime: 16,
                condition: "hasMemoryChip === true",
                actionCode: 'variables.aiStatus = "trusted";',
              },
              {
                id: "c2b-2",
                text: "🏃 拒绝建议，直接逃离实验室",
                targetSceneId: "scene-3b",
                triggerTime: 16,
                actionCode: 'variables.aiStatus = "ignored";',
              },
            ],
          },
        },
      ],
    },
  ],
};
