import { useCallback, useEffect, useState } from "react";
import { ProfilePicker } from "./screens/ProfilePicker";
import { Game } from "./screens/Game";
import { ParentPanel } from "./screens/ParentPanel";
import { publicProfile, type PublicProfile } from "./game/engine";
import { probeServer } from "./game/server";
import * as store from "./store/local";

export default function App() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [active, setActive] = useState<PublicProfile | null>(null);
  const [parentPanel, setParentPanel] = useState(false);
  const [ready, setReady] = useState(false);
  const [noStorage, setNoStorage] = useState(false);

  const refresh = useCallback(() => {
    const list = store.listProfiles().map(publicProfile);
    setProfiles(list);
    return list;
  }, []);

  useEffect(() => {
    if (!store.storageAvailable()) setNoStorage(true);

    const list = refresh();
    const remembered = store.lastProfileId();
    const match = list.find((profile) => profile.id === remembered);
    if (match) setActive(match);

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
    refresh();
    if (active?.id === id) {
      setActive(null);
      store.rememberLastProfile(null);
    }
  }

  if (!ready) return <div className="boot">רגע, פותחים את הסופר… 🛒</div>;

  if (parentPanel) {
    return (
      <ParentPanel
        onClose={() => {
          setParentPanel(false);
          refresh();
        }}
      />
    );
  }

  if (!active) {
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
          onPick={pick}
          onCreate={create}
          onDelete={remove}
          onParentPanel={() => setParentPanel(true)}
        />
      </>
    );
  }

  return (
    <Game
      profile={active}
      setProfile={setActive}
      onSwitchProfile={() => {
        setActive(null);
        store.rememberLastProfile(null);
        refresh();
      }}
      onParentPanel={() => setParentPanel(true)}
    />
  );
}
