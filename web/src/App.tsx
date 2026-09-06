import { useCallback, useEffect, useState } from "react";
import { ProfilePicker } from "./screens/ProfilePicker";
import { Welcome } from "./screens/Welcome";
import { TryRiddle } from "./screens/TryRiddle";
import { Terms } from "./screens/Terms";
import { Game } from "./screens/Game";
import { ParentPanel } from "./screens/ParentPanel";
import { ParentSetup } from "./screens/ParentSetup";
import { ParentGame } from "./screens/ParentGame";
import { WorldPicker } from "./screens/WorldPicker";
import { dailyView, publicProfile, type PublicProfile } from "./game/engine";
import { createSession, type GroupMode, type GroupSession } from "./game/group";
import { probeServer } from "./game/server";
import * as store from "./store/local";
import { FEATURES } from "./config";
import { DEFAULT_WORLD, getWorld } from "../../shared/worlds";
import { DAILY } from "../../shared/daily";
import { log } from "./lib/log";

type Screen =
  | "welcome"
  | "try"
  | "terms"
  | "picker"
  | "worlds"
  | "solo"
  | "parent-setup"
  | "parent-game"
  | "settings";

export default function App() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [active, setActive] = useState<PublicProfile | null>(null);
  const [session, setSession] = useState<GroupSession | null>(null);
  const [screen, setScreen] = useState<Screen>("picker");
  // הביקור הראשון מתחיל בבחירה, לא בטופס
  const [creating, setCreating] = useState(false);
  const [world, setWorld] = useState<string>(DEFAULT_WORLD);
  const [ready, setReady] = useState(false);
  const [noStorage, setNoStorage] = useState(false);

  const refresh = useCallback(() => {
    const list = store.listProfiles().map((profile) => publicProfile(profile));
    setProfiles(list);
    return list;
  }, []);

  useEffect(() => {
    if (!store.storageAvailable()) setNoStorage(true);

    const list = refresh();
    if (!list.length) setScreen("welcome");
    const remembered = store.lastProfileId();
    const match = list.find((profile) => profile.id === remembered);
    if (match) {
      // חוזרים בדיוק לאן שהיו — אותו שחקן, אותו עולם
      const lastWorld = store.lastWorld();
      const world =
        lastWorld === DAILY ? DEFAULT_WORLD : getWorld(lastWorld ?? DEFAULT_WORLD).id;
      const full = store.getProfile(match.id);
      setWorld(world);
      setActive(full ? publicProfile(full, world) : match);
      setScreen("solo");
    }

    log("app", "המשחק נטען", { data: { profiles: list.length } });

    if (!FEATURES.agaliChat) {
      setReady(true);
      return;
    }

    // אם המשחק מוגש מהשרת המקומי ויש בו מפתח, זו ברירת המחדל —
    // כך שהמשפחה לא צריכה להדביק מפתח בדפדפן בכלל.
    probeServer().then((server) => {
      const settings = store.getSettings();
      if (server.serverKey && settings.chatSource === "off" && !settings.apiKey) {
        store.updateSettings({ chatSource: "server" });
      }
      setReady(true);
    });
  }, [refresh]);

  function pick(profile: PublicProfile) {
    setActive(profile);
    store.rememberLastProfile(profile.id);
    setScreen("worlds");
  }

  function enterDaily() {
    const profile = active && store.getProfile(active.id);
    if (!profile) return;
    setWorld(DAILY);
    setActive(publicProfile(profile));
    setScreen("solo");
    log("app", "נכנסו לחידת היום");
  }

  function enterWorld(next: string) {
    const profile = active && store.getProfile(active.id);
    if (!profile) return;
    setWorld(next);
    store.rememberLastWorld(next);
    setActive(publicProfile(profile, next));
    setScreen("solo");
    log("app", "נכנסו לעולם", { data: { world: next } });
  }

  function create(input: {
    name: string;
    age: number;
    address: "male" | "female";
    avatar: string;
  }) {
    const profile = store.createProfile(input);
    refresh();
    pick(publicProfile(profile));
  }

  function remove(id: string) {
    store.deleteProfile(id);
    const left = refresh();
    if (active?.id === id) {
      setActive(null);
      store.rememberLastProfile(null);
      // מחקו את האחרון — חוזרים למסך הפתיחה, לא לרשימה ריקה
      setScreen(left.length ? "picker" : "welcome");
    }
  }

  function backToPicker() {
    setCreating(false);
    setActive(null);
    setSession(null);
    store.rememberLastProfile(null);
    const left = refresh();
    setScreen(left.length ? "picker" : "welcome");
  }

  function startGroup(input: {
    profileIds: string[];
    mode: GroupMode;
    level: number;
    world: string;
  }) {
    setSession(createSession(input.profileIds, input.mode, input.level, input.world));
    setScreen("parent-game");
  }

  if (!ready) return <div className="boot">רגע, פותחים את המשחק… 🧩</div>;

  if (screen === "settings") {
    return (
      <ParentPanel
        onClose={() => {
          refresh();
          const profile = active && store.getProfile(active.id);
          if (profile) setActive(publicProfile(profile, world));
          setScreen(active ? "solo" : "picker");
        }}
      />
    );
  }

  if (screen === "welcome") {
    return (
      <Welcome
        onTry={() => setScreen("try")}
        onSolo={() => {
          setCreating(true);
          setScreen("picker");
        }}
        onParentMode={() => {
          setCreating(true);
          setScreen("picker");
        }}
        onTerms={() => setScreen("terms")}
      />
    );
  }

  if (screen === "try") {
    return (
      <TryRiddle
        onCreate={() => {
          setCreating(true);
          setScreen("picker");
        }}
        onBack={() => setScreen(profiles.length ? "picker" : "welcome")}
      />
    );
  }

  if (screen === "terms") {
    return <Terms onClose={() => setScreen(profiles.length ? "picker" : "welcome")} />;
  }

  if (screen === "parent-setup") {
    return (
      <ParentSetup
        profiles={profiles}
        onStart={startGroup}
        onCancel={() => setScreen("picker")}
      />
    );
  }

  if (screen === "parent-game" && session) {
    return <ParentGame session={session} onExit={backToPicker} />;
  }

  if (screen === "worlds" && active) {
    const profile = store.getProfile(active.id);
    if (profile) {
      return (
        <WorldPicker
          profile={profile}
          daily={dailyView(profile.id)}
          onPick={enterWorld}
          onDaily={enterDaily}
          onBack={backToPicker}
        />
      );
    }
  }

  if (screen === "solo" && active) {
    return (
      <Game
        profile={active}
        world={world}
        daily={world === DAILY}
        setProfile={setActive}
        onSwitchWorld={() => setScreen("worlds")}
        onParentPanel={() => setScreen("settings")}
      />
    );
  }

  return (
    <>
      {noStorage && (
        <p className="storage-warning">
          הדפדפן חוסם שמירה מקומית (אולי גלישה פרטית). אפשר לשחק, אבל ההתקדמות לא
          תישמר.
        </p>
      )}
      <ProfilePicker
        profiles={profiles}
        startCreating={creating}
        onDoneCreating={() => setCreating(false)}
        onTry={() => setScreen("try")}
        onPick={pick}
        onCreate={create}
        onDelete={remove}
        onParentPanel={() => setScreen("settings")}
        onParentMode={() => setScreen("parent-setup")}
      />
    </>
  );
}
