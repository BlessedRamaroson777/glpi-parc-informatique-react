import { useState } from "react";

export default function SelectExample() {
  const [action, setAction] = useState("");

  function runAction() {
    if (!action) {
      return;
    }

    alert(`Action: ${action}`);
  }

  return (
    <div>
      <select
        value={action}
        onChange={(event) => setAction(event.target.value)}
      >
        <option value="">Choisir...</option>
        <option value="import">Import</option>
        <option value="reset">Reinitialisation</option>
      </select>

      <button type="button" onClick={runAction}>
        Executer
      </button>
    </div>
  );
}
