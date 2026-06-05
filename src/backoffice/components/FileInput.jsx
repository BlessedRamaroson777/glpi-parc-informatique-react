export default function FileInput({ inputRef, label }) {
  return (
    <label>
      {label}
      <input type="file" ref={inputRef} />
    </label>
  );
}