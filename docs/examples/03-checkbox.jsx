import { useState } from "react";

export default function CheckboxExample() {
  const [accepted, setAccepted] = useState(false);

  return (
    <label>
      <input
        type="checkbox"
        checked={accepted}
        onChange={(event) => setAccepted(event.target.checked)}
      />
      J'accepte
    </label>
  );
}
