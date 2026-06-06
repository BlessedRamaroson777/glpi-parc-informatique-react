import React, { useRef } from "react";
import FileInput from "./FileInput";
import "../styles/UploadForm.css";

export default function UploadForm() {
  const file1Ref = useRef(null);
  const file2Ref = useRef(null);
  const file3Ref = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const file1 = file1Ref.current.files[0];
    const file2 = file2Ref.current.files[0];
    const file3 = file3Ref.current.files[0];

    console.log(file1);
    console.log(file2);
    console.log(file3);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FileInput
        label="Fichier 1 : "
        inputRef={file1Ref}
      />

      <FileInput
        label="Fichier 2 : "
        inputRef={file2Ref}
      />

      <FileInput
        label="Fichier 3 : "
        inputRef={file3Ref}
      />

      <button type="submit">Valider</button>
    </form>
  );
}