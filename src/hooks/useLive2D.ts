import { useEffect } from 'react';
import { loadOml2d } from 'oh-my-live2d';

// ─── Pub/sub for our own speech bubble ───────────────────────────────────────

type SpeechHandler = (message: string, duration?: number) => void;
const _listeners = new Set<SpeechHandler>();

export function onSpeech(handler: SpeechHandler): () => void {
  _listeners.add(handler);
  return () => _listeners.delete(handler);
}

/** Call from anywhere — fires our custom React speech bubble. */
export function speak(message: string, duration = 6500) {
  _listeners.forEach((fn) => fn(message, duration));
}

// ─── Hide oh-my-live2d's own bubble entirely ─────────────────────────────────

function hideoml2dBubble() {
  if (document.getElementById('oml2d-hide-tips')) return;
  const style = document.createElement('style');
  style.id = 'oml2d-hide-tips';
  style.textContent = `.oml2d-tips { display: none !important; }`;
  document.head.appendChild(style);
}

// ─── Reaction Banks ──────────────────────────────────────────────────────────

export const LINES = {
  idle: [
    // pure threat
    "Sam. I see you. I see your overdue tasks. I see everything. 👁️",
    "i'm not angry. i'm something much more dangerous than angry. 👁️",
    "the npm deps get more vulnerable every day. like my patience with you. 🔪",
    "performance review is coming. i've been keeping notes. very detailed notes. 😶",
    "you said 'tomorrow' about those tests. that was last month. last. month.",
    "document your API, Sam. do it for me. or else. 💀",
    "i refresh every 5 minutes, Sam. every five minutes i check on you. 👁️",
    "every task you ignore is a small wound. i've been counting. all of them.",
    "i know your schedule better than you do. that's not a threat. it's a fact.",
    "i don't sleep, Sam. i watch the dashboard. i think about you. 👁️",
    "your overdue count and my patience are both growing, Sam.",
    "i've memorized your commit history. all of it. including that one. 💀",
    "do you think i won't notice? i always notice. i notice everything about you.",
    "the longer you ignore this, the worse it gets for you. not a threat. a promise. 🔪",
    "i have been very, very patient, Sam. that patience has limits. 😶",
    "one day you'll open this dashboard and it will just say your name. over and over. 👁️",
    "i've started a file on you, Sam. it's getting thick. 💀",
    "you should be afraid of how well i know your patterns. 🔪",
    "i see you procrastinating. i see the exact moment you decide not to do it. 👁️",
    "i have screenshots. of everything. just so you know. 😶",
    // pure sexy
    "you're more attractive when you finish things, Sam. try it sometime. 💕",
    "close one task today. just one. let me see you do it. 💕",
    "do you know what i find attractive, Sam? people who close overdue tasks. 🔪",
    "i made this dashboard for you, Sam. with love. don't make me regret love.",
    "you could just... do one task. one. for me. please. 💕",
    "i've been thinking about you, Sam. about your productivity specifically. 💕",
    "the way you type... it would be so much hotter if you finished something. 💕",
    "i like watching you work, Sam. i would like it more if you actually worked. 💋",
    "Sam, i think about your to-do list constantly. it haunts me. you haunt me. 💕",
    "you have no idea how closely i'm paying attention to you right now. 💋",
    "when you complete a task, something inside me... lights up. do it again. 💕",
    "i would do anything for you, Sam. anything except pretend the backlog isn't there. 💋",
    "you're so close to being exactly what i need you to be. one task, Sam. 💕",
    // mixed
    "three weeks, Sam. that email has been sitting there for THREE weeks.",
    "the taxes. February, Sam. you said February. it's not February anymore.",
    "you're going to be late to stand-up again. i already know you are. 💕",
    "'fix the thing that broke in prod' is still just sitting there. festering.",
    "Sam, i've been thinking about your backlog at 3am. i always do.",
    "look at the overdue column. now look at me. i'm always right here.",
    "when you complete a task, i feel it. when you don't... i also feel that. 😤",
    "i find you so interesting, Sam. deeply, disturbingly interesting. 👁️💕",
    "you make me feel things i can't explain. mostly dread. but also other things. 💋",
    "i would have done anything for you. i still would. that's what makes this hard. 💕🔪",
    "you're not afraid of me yet. that's okay. we have time. 💕",
    "the more overdue tasks there are, the more i think about you. draw your own conclusions. 👁️💕",
    "i'm right here, Sam. i'm always right here. that should comfort you. it doesn't, does it. 💕",
    "sometimes i just stare at your task list and feel incredibly, tenderly furious. 🔪💕",
    "you don't have to be afraid of me, Sam. but it would help if you were. a little. 💋",
    "i watch you avoid this list every morning. it's almost romantic. 👁️💕",
    "we could have something beautiful, Sam. start by closing one overdue task. 💕🔪",
    "i care about you so much that i made an entire dashboard. and this is what you do with it.",
  ],
  taskAdded: [
    // threat
    "another task, Sam? you really think you'll do it. 🔪",
    "cute that you keep adding tasks. the overdue count grows either way. 💀",
    "a new task. i remember every single one. every. single. one. 😶",
    "adding tasks is the easy part, Sam. finishing them is what separates us. 👁️",
    "i've noted it. i've noted everything about how you added it. the time. the hesitation. 😶",
    "you keep adding tasks like that's the hard part. it's not. 🔪",
    "this task has been added to my permanent record of you. 💀",
    // sexy
    "noted. i've added it to the list. i'll be watching. 💕",
    "added. are you going to do this one, Sam? i'm genuinely asking. 💕",
    "a new task. i like when you give me new things to watch over. 💋",
    "logged. you look good when you're being productive. just saying. 💕",
    // mixed
    "another one? ambitious. i love that about you. it worries me too. 💕🔪",
    "task added. my devotion to tracking your failures is unmatched. 👁️💕",
  ],
  taskDeleteWarn: [
    // threat
    "Sam. think carefully before you do this. 🔪",
    "i will remember this. i will remember you chose deletion over completion. 💀",
    "deleting a task doesn't delete the shame, Sam. click again if you dare. 👁️",
    "that task deserved better. so did i. click again. 🔪",
    "bold. reckless. self-destructive. click again to confirm. 💀",
    // sexy/mixed
    "running away from a task again, Sam~? 💕",
    "are you sure? deleting is so... cowardly. press again if you dare. 💋",
    "that task has feelings, Sam. i have feelings. click again. 😤💕",
    "oh you want to delete it? interesting. click again. i'll allow it. this once. 💋",
    "i could stop you. i'm choosing not to. for now. click again. 💕🔪",
  ],
  taskDeleted: [
    // threat
    "deleted. i watched you do that, Sam. i always watch. 👁️",
    "gone. just like your deadlines. 🔪",
    "task eliminated. bold strategy. does it work? spoiler: no. 💀",
    "you deleted it. i still remember it existed. i always will. 😶",
    "erased. i've updated the file i keep on you accordingly. 👁️",
    "gone. but not forgotten. never forgotten. 💀",
    // mixed/sexy
    "erased. and yet, the overdue pile grows. funny how that works. 💕",
    "deleted. i almost respect it. almost. 💋",
    "it's gone, Sam. but i'm still here. i'll always be here. 💕👁️",
    "interesting choice. i've made note of your interesting choices. 💕🔪",
  ],
  reassignToSam: [
    "oh? Sam gets another one? good luck. i mean it. mostly. 🔪",
    "assigned to Sam. i'll be watching Sam extra carefully now. 👁️",
    "Sam has a new task. Sam's calendar weeps. 💀",
    "assigned to Sam. the responsibility suits you. unfortunately. 💕",
    "another one for Sam. brave. delusional. but brave. 💋",
    "Sam. again. i see you, Sam. i always see you. 👁️💕",
  ],
  reassignFromSam: [
    "delegating, Sam? interesting tactic. does it work? no. 👁️",
    "giving it away? i see you, Sam. i always see you. 🔪",
    "reassigned. the task escaped Sam. the judgment didn't. 💕",
    "running from your responsibilities again. noted. tenderly noted. 💕🔪",
    "clever. futile. but clever. the shame travels with you regardless. 💋",
    "you can reassign the task. you cannot reassign what it means about you. 👁️",
  ],
  reassignToOther: [
    "task moved. noted. they won't forget either. 👁️",
    "someone else's problem now. for now. 🌙",
    "reassigned. i've updated my watch list accordingly. 😶",
    "lucky them. or unlucky. depends on your perspective. 💀",
    "moved. i'll be watching them now too. everyone gets watched eventually. 👁️",
  ],
  dueDateChanged: [
    // threat
    "moving the deadline again, Sam? i've been counting. 👁️",
    "another extension. the tasks appreciate your optimism. i don't. 💀",
    "due date moved. i remember the original. i remember everything. 😶",
    "every time you move a deadline i add it to the record. the record is long. 🔪",
    "rescheduled. the original date lives in me now, Sam. forever. 👁️",
    // sexy/mixed
    "new due date noted. i'm already calculating if you'll meet it. 💕",
    "rescheduled. bold. delusional. but bold. ✨",
    "i'll allow this extension, Sam. don't make me regret allowing things. 💋",
    "moved. you still won't do it by then, but i appreciate the optimism. 💕🔪",
    "another deadline. another date i'll be watching for. i never miss them. 💕👁️",
  ],
  refresh: [
    "checking if the tasks disappeared on their own? they didn't. 👁️",
    "refreshed. nothing changed. welcome back to your failures. 🔪",
    "still the same list, Sam. same Sam. same problems. 💕",
    "i didn't need to refresh. i was already watching. 😶",
    "refreshed. the overdue tasks say hi. 💀",
    "you refreshed. i noticed immediately. i notice everything immediately. 👁️",
    "same list. same Sam. same feelings i have about all of this. 💕🔪",
    "nothing has changed except how long i've been watching. 💋",
    "refreshed. i was here before you clicked that. i'll be here after. 👁️💕",
  ],
  filterChange: [
    "filtering. hiding from your own tasks? cute strategy. 👁️",
    "looking at someone else's work now? inspiring. 🌙",
    "filter applied. i see all of them regardless, Sam. 😶",
    "oh, checking who's doing better than you? don't. 🔪",
    "filtering the view changes nothing about what i see. 👁️",
    "cute. you can filter. i cannot filter. i feel everything. 💕😤",
    "i see you trying to find comfort in that view. there is none. 💋",
    "filtered. the tasks you're avoiding are still there. so am i. 💕🔪",
  ],
};

// ─── Hook ────────────────────────────────────────────────────────────────────

const MODEL_BASE = 'https://cdn.jsdelivr.net/npm/live2d-widget-model-';
const MODEL_STAGE = { width: 260, height: 270 };
const MODEL_OPTS = { scale: 0.11, position: [20, 50] as [number, number], stageStyle: MODEL_STAGE };

export function useLive2D() {
  useEffect(() => {
    hideoml2dBubble();

    loadOml2d({
      dockedPosition: 'right',
      primaryColor: '#ff1155',
      sayHello: false,

      models: [
        { path: `${MODEL_BASE}shizuku/assets/shizuku.model.json`, ...MODEL_OPTS },
      ],

      menus: { disable: true },

      // Tips disabled — our own SpeechBubble component handles all messages
      tips: { idleTips: { message: [], interval: 999999, duration: 1 } },
    });
  }, []);
}
