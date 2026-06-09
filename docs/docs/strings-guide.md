# Guide complet : Manipulation des Strings en JavaScript / JSX

---

## 1. Création d'une string

```js
// Littéraux
const a = "double guillemets";
const b = 'simple guillemets';
const c = `backticks (template literal)`;

// Constructeur (éviter en général)
const d = new String("objet String"); // objet, pas primitif
const e = String("primitif");         // conversion en primitif

// String vide
const vide = "";
const vide2 = '';
const vide3 = ``;
```

---

## 2. Concaténation

```js
const a = "Bonjour";
const b = "monde";

// Opérateur +
a + " " + b;            // "Bonjour monde"

// Template literal — recommandé
`${a} ${b}`;            // "Bonjour monde"

// concat()
a.concat(" ", b);       // "Bonjour monde"

// +=
let s = "Hello";
s += " World";          // "Hello World"

// join sur tableau
["Bonjour", "monde"].join(" "); // "Bonjour monde"

// Spread + join
[..."abc", ..."def"].join(""); // "abcdef"
```

### Concaténation avec des expressions
```js
const x = 5;
`Résultat : ${x * 2}`;          // "Résultat : 10"
`${x > 3 ? "grand" : "petit"}`; // "grand"
`${[1,2,3].join(", ")}`;        // "1, 2, 3"
`${{ toString: () => "obj" }}`; // "obj"
```

---

## 3. Longueur

```js
"Bonjour".length; // 7
"".length;        // 0
"😀".length;      // 2 (attention aux emojis — 2 code units)
[..."😀"].length; // 1 (spread pour vrai comptage)
```

---

## 4. Accès aux caractères

```js
const s = "Bonjour";

s[0];          // "B"
s[6];          // "r"
s[-1];         // undefined (pas d'index négatif)
s.charAt(0);   // "B"
s.charAt(99);  // "" (hors limite = string vide)
s.at(0);       // "B"
s.at(-1);      // "r" (dernier)
s.at(-2);      // "u" (avant-dernier)
```

---

## 5. Codes de caractères (Unicode)

```js
"A".charCodeAt(0);          // 65  (UTF-16 code unit)
"A".codePointAt(0);         // 65  (Unicode code point)
"😀".charCodeAt(0);         // 55357 (surrogate pair)
"😀".codePointAt(0);        // 128512 (vrai code point)

String.fromCharCode(65);    // "A"
String.fromCharCode(72, 101, 108, 108, 111); // "Hello"
String.fromCodePoint(128512); // "😀"
String.fromCodePoint(65, 66, 67); // "ABC"
```

---

## 6. Recherche / Vérification

### Contient ?
```js
"Bonjour monde".includes("monde");       // true
"Bonjour monde".includes("monde", 10);  // false (cherche à partir de l'index 10)
```

### Commence / finit par
```js
"Bonjour".startsWith("Bon");         // true
"Bonjour".startsWith("jour", 3);     // true (depuis l'index 3)
"Bonjour".endsWith("jour");          // true
"Bonjour".endsWith("Bon", 3);        // true (considère les 3 premiers caractères)
```

### Position
```js
const s = "abcabcabc";
s.indexOf("b");           // 1 (premier)
s.indexOf("b", 2);        // 4 (depuis index 2)
s.lastIndexOf("b");       // 7 (dernier)
s.lastIndexOf("b", 6);    // 4 (cherche en arrière depuis 6)
s.indexOf("z");           // -1 (non trouvé)
```

### Avec regex
```js
"Bonjour 123".search(/\d+/);  // 8 (position du match)
"Bonjour".search(/xyz/);      // -1
```

### Test regex
```js
/^\d+$/.test("123");     // true (que des chiffres)
/^\d+$/.test("abc");     // false
```

---

## 7. Extraction

### `slice(debut, fin)` — recommandé
```js
const s = "Bonjour monde";
s.slice(0, 7);    // "Bonjour"
s.slice(8);       // "monde"
s.slice(-5);      // "monde" (5 derniers)
s.slice(-5, -2);  // "mon"
s.slice(0, -6);   // "Bonjour"
```

### `substring(debut, fin)`
```js
const s = "Bonjour monde";
s.substring(8, 13); // "monde"
s.substring(0, 7);  // "Bonjour"
// Si debut > fin, les inverse automatiquement
s.substring(7, 0);  // "Bonjour"
// Les valeurs négatives sont traitées comme 0
s.substring(-3);    // "Bonjour monde"
```

### `substr(debut, longueur)` — obsolète mais encore utilisé
```js
"Bonjour monde".substr(8, 5); // "monde" (commence à 8, longueur 5)
"Bonjour monde".substr(-5, 5); // "monde"
```

---

## 8. Casse (majuscule / minuscule)

```js
"Bonjour Monde".toUpperCase(); // "BONJOUR MONDE"
"Bonjour Monde".toLowerCase(); // "bonjour monde"

// Locale-sensitive
"istanbul".toLocaleUpperCase("tr"); // "İSTANBUL" (i turc avec point)
"İSTANBUL".toLocaleLowerCase("tr"); // "istanbul"
```

### Recettes courantes
```js
// Première lettre en majuscule
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
capitalize("bONJOUR"); // "Bonjour"

// Chaque mot avec majuscule
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
titleCase("bonjour tout le monde"); // "Bonjour Tout Le Monde"

// camelCase → snake_case
const toSnakeCase = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
toSnakeCase("nomComplet"); // "nom_complet"

// snake_case → camelCase
const toCamelCase = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
toCamelCase("nom_complet"); // "nomComplet"

// kebab-case → camelCase
const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
kebabToCamel("nom-complet"); // "nomComplet"
```

---

## 9. Suppression des espaces / trim

```js
"  Bonjour  ".trim();      // "Bonjour"
"  Bonjour  ".trimStart(); // "Bonjour  "  (alias: trimLeft)
"  Bonjour  ".trimEnd();   // "  Bonjour"  (alias: trimRight)
```

### Supprimer tous les espaces
```js
"Bon jour mon de".replaceAll(" ", "");   // "Bonjourmonde"
"Bon jour mon de".replace(/\s+/g, "");   // "Bonjourmonde"
```

### Normaliser les espaces multiples
```js
"Bonjour   tout   le   monde".replace(/\s+/g, " ").trim();
// "Bonjour tout le monde"
```

---

## 10. Remplacement

### `replace()` — premier match uniquement
```js
"chat chat chat".replace("chat", "chien");       // "chien chat chat"
"aababab".replace(/a/g, "X");                    // "XXbXbXb" (avec flag g)
```

### `replaceAll()` — tous les matches
```js
"chat chat chat".replaceAll("chat", "chien");    // "chien chien chien"
```

### Avec fonction
```js
"prix: 100, tva: 20".replace(/\d+/g, (n) => n * 2);
// "prix: 200, tva: 40"

"bonjour monde".replace(/\b\w/g, (c) => c.toUpperCase());
// "Bonjour Monde"
```

### Références de capture dans le remplacement
```js
"Jean Dupont".replace(/(\w+) (\w+)/, "$2, $1");
// "Dupont, Jean"

"2026-06-08".replace(/(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1");
// "08/06/2026"
```

---

## 11. Split / Join

```js
"a,b,c,d".split(",");        // ["a","b","c","d"]
"a,b,c".split(",", 2);       // ["a","b"] (limite)
"Bonjour".split("");         // ["B","o","n","j","o","u","r"]
"Bonjour".split();           // ["Bonjour"] (sans séparateur)

// Avec regex
"a1b2c3".split(/\d/);        // ["a","b","c",""]

// Join
["a","b","c"].join("-");     // "a-b-c"
["a","b","c"].join("");      // "abc"
["a","b","c"].join();        // "a,b,c" (virgule par défaut)
```

---

## 12. Répétition et remplissage

```js
"ab".repeat(3);         // "ababab"
"ha".repeat(0);         // ""

"5".padStart(3, "0");   // "005"
"5".padEnd(3, "0");     // "500"
"5".padStart(5, "xy");  // "xyxy5"
"abc".padStart(2);      // "abc" (pas de troncature)

// Créer une ligne de séparation
"-".repeat(40);         // "----------------------------------------"
```

---

## 13. Normalisation Unicode

```js
// NFD : décompose les accents
"café".normalize("NFD");   // "café" (e + combining accent)

// NFC : recompose
"café".normalize("NFC"); // "café"

// Supprimer les accents
const sansAccents = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

sansAccents("Héllo Wörld"); // "Hello World"
sansAccents("résumé");      // "resume"
```

---

## 14. Regex — toutes les méthodes

### `match()` — chercher des matches
```js
const s = "prix 100 Ar et taxe 20 Ar";
s.match(/\d+/);    // ["100"] (premier match + infos)
s.match(/\d+/g);   // ["100", "20"] (tous avec flag g)
s.match(/xyz/);    // null (pas de match)

// Avec groupes de capture
"Jean Dupont".match(/(\w+) (\w+)/);
// ["Jean Dupont", "Jean", "Dupont", index: 0, ...]
```

### `matchAll()` — tous les matches avec groupes
```js
const s = "chat1 chien2 chat3";
const matches = [...s.matchAll(/(\w+?)(\d)/g)];
// [["chat1","chat","1"], ["chien2","chien","2"], ["chat3","chat","3"]]

for (const [full, mot, num] of s.matchAll(/(\w+?)(\d)/g)) {
  console.log(mot, num);
}
```

### `replace()` avec regex
```js
"Bonjour MONDE".replace(/[A-Z]+/g, (m) => m.toLowerCase()); // "Bonjour monde"
```

### `search()` — position du premier match
```js
"abc123".search(/\d/); // 3
```

### `test()` — booléen
```js
/^\d{4}$/.test("2026"); // true
```

---

## 15. Caractères spéciaux / Échappement

```js
"Ligne 1\nLigne 2";     // saut de ligne
"Col1\tCol2";           // tabulation
"C:\\Users\\Jean";      // antislash
"Il a dit \"Bonjour\""; // guillemets dans string
'It\'s fine';           // apostrophe dans simple quote
`Backtick : \``;        // backtick dans template literal
"A";               // "A" (Unicode escape)
"\u{1F600}";            // "😀" (Unicode point étendu)
"\n\r\t\b\f\v\0";       // contrôles ASCII
```

---

## 16. Multiline strings

```js
// Template literal — garde les sauts de ligne
const html = `
  <div>
    <p>Bonjour</p>
  </div>
`;

// Concaténation classique
const texte = "Ligne 1\n" +
              "Ligne 2\n" +
              "Ligne 3";

// String.raw — pas d'interprétation des échappements
String.raw`C:\Users\Jean\Documents`; // "C:\Users\Jean\Documents"
String.raw`Ligne1\nLigne2`;          // "Ligne1\nLigne2" (le \n n'est pas interprété)
```

---

## 17. Tagged template literals

```js
// Tag personnalisé
function highlight(strings, ...values) {
  return strings.reduce((acc, str, i) =>
    acc + str + (values[i] !== undefined ? `[${values[i]}]` : ""), "");
}

const nom = "Jean";
const age = 30;
highlight`Bonjour ${nom}, tu as ${age} ans.`;
// "Bonjour [Jean], tu as [30] ans."

// Cas pratique : SQL sécurisé (exemple)
function sql(strings, ...params) {
  return {
    text: strings.reduce((s, str, i) => s + (i > 0 ? `$${i}` : "") + str),
    params
  };
}
sql`SELECT * FROM users WHERE id = ${userId} AND actif = ${true}`;
// { text: "SELECT * FROM users WHERE id = $1 AND actif = $2", params: [userId, true] }
```

---

## 18. Conversion

### Vers string
```js
String(42);            // "42"
String(true);          // "true"
String(null);          // "null"
String(undefined);     // "undefined"
String([1,2,3]);       // "1,2,3"
String({});            // "[object Object]"

(42).toString();       // "42"
(255).toString(16);    // "ff" (hexadécimal)
(255).toString(2);     // "11111111" (binaire)
(8).toString(8);       // "10" (octal)

(3.14159).toFixed(2);       // "3.14"
(3.14159).toPrecision(4);   // "3.142"
(1234567).toExponential(2); // "1.23e+6"

"" + 42;               // "42" (coercion implicite)
`${42}`;               // "42"
```

### Vers nombre
```js
Number("42");          // 42
Number("3.14");        // 3.14
Number("42abc");       // NaN
Number("");            // 0
Number(true);          // 1
Number(false);         // 0
Number(null);          // 0
Number(undefined);     // NaN

parseInt("42px");      // 42
parseInt("0xFF", 16);  // 255 (base 16)
parseInt("111", 2);    // 7 (base 2)
parseFloat("3.14xyz"); // 3.14

+"42";                 // 42 (unary +)
~~"42";                // 42 (double bitwise NOT, entier uniquement)
```

### Vers tableau
```js
"abc".split("");                // ["a","b","c"]
[..."abc"];                     // ["a","b","c"]
Array.from("abc");              // ["a","b","c"]
Array.from("abc", c => c.toUpperCase()); // ["A","B","C"]
```

### Vers JSON
```js
JSON.stringify({ a: 1 });                  // '{"a":1}'
JSON.stringify({ a: 1 }, null, 2);         // formaté avec indentation
JSON.stringify([1, "deux", true]);          // '[1,"deux",true]'
JSON.parse('{"a":1}');                     // { a: 1 }
```

---

## 19. Comparaison

```js
"abc" === "abc";    // true (strict)
"abc" == "abc";     // true
"abc" < "abd";      // true (comparaison lexicographique)
"B" < "a";          // true (majuscules avant minuscules en ASCII)

// Comparaison locale (pour tri naturel)
"é".localeCompare("e");              // 1 (é > e)
"é".localeCompare("e", "fr");        // 1
"cafe".localeCompare("café", "fr");  // -1

// Trier un tableau de strings
["banane", "Ananas", "citron"].sort((a, b) =>
  a.localeCompare(b, "fr", { sensitivity: "base" })
);
// ["Ananas", "banane", "citron"]
```

---

## 20. Vérifications

```js
typeof "abc" === "string";     // true
typeof new String("") === "object"; // true (objet String)

// String vide / falsy
!!"";                 // false
!!"abc";              // true
"".length === 0;      // true

// Null / undefined / vide
const estVide = (s) => s == null || String(s).trim() === "";
estVide(null);        // true
estVide(undefined);   // true
estVide("");          // true
estVide("  ");        // true
estVide("abc");       // false

// Seulement des espaces
"   ".trim() === "";  // true

// Contient uniquement des chiffres
/^\d+$/.test("123");  // true

// Email valide (regex simple)
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("user@mail.com"); // true

// URL valide (via URL API)
const estURL = (s) => { try { new URL(s); return true; } catch { return false; } };
estURL("https://google.com"); // true
estURL("pas une url");        // false
```

---

## 21. Encodage

```js
// URI
encodeURIComponent("Bonjour monde & toi");
// "Bonjour%20monde%20%26%20toi"

decodeURIComponent("Bonjour%20monde%20%26%20toi");
// "Bonjour monde & toi"

encodeURI("https://example.com/page?a=1&b=2");
// "https://example.com/page?a=1&b=2" (n'encode pas les caractères URI)

// Base64
btoa("Bonjour");           // "Qm9uam91cg==" (browser/Node)
atob("Qm9uam91cg==");      // "Bonjour"

// Node.js
Buffer.from("Bonjour").toString("base64");    // "Qm9uam91cg=="
Buffer.from("Qm9uam91cg==", "base64").toString(); // "Bonjour"
```

---

## 22. Formatage des nombres / dates en string

```js
// Intl.NumberFormat
new Intl.NumberFormat("fr-FR").format(1234567.89);
// "1 234 567,89"

new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(1500);
// "1 500,00 €"

new Intl.NumberFormat("en-US", { style: "percent" }).format(0.25);
// "25%"

new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(42);
// "42,00"

// Intl.DateTimeFormat
new Intl.DateTimeFormat("fr-FR").format(new Date());
// "08/06/2026"

new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
// "8 juin 2026"

new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date());
// "lundi 8 juin 2026 à 14:30"
```

---

## 23. Strings en JSX

### Affichage simple
```jsx
const nom = "Jean";
return <p>Bonjour {nom} !</p>;
// Bonjour Jean !
```

### Concaténation dans JSX
```jsx
return <p>{"Bonjour " + nom + " !"}</p>;
// ou :
return <p>{`Bonjour ${nom} !`}</p>;
```

### Affichage conditionnel de texte
```jsx
const actif = true;
return <span>{actif ? "Actif" : "Inactif"}</span>;

// Avec &&
return <span>{actif && "Actif"}</span>;

// Attention : 0 && ... affiche "0" en JSX
const count = 0;
return <span>{count > 0 && "Résultats"}</span>; // safe
return <span>{count && "Résultats"}</span>;      // affiche "0" ! éviter
```

### Nombre formaté
```jsx
const montant = 12500.5;
return <p>{montant.toFixed(2)} Ar</p>;
return <p>{new Intl.NumberFormat("fr-FR").format(montant)} Ar</p>;
```

### String avec saut de ligne
```jsx
// \n n'est pas rendu en HTML — utiliser <br> ou white-space: pre
const texte = "Ligne 1\nLigne 2";
return <p style={{ whiteSpace: "pre-wrap" }}>{texte}</p>;

// Ou convertir \n en <br>
return (
  <p>
    {texte.split("\n").map((ligne, i) => (
      <span key={i}>{ligne}<br /></span>
    ))}
  </p>
);
```

### Liste de strings
```jsx
const tags = ["React", "Node", "SQLite"];
return (
  <ul>
    {tags.map((tag, i) => <li key={i}>{tag}</li>)}
  </ul>
);
```

### Tronquer dans JSX
```jsx
const tronquer = (s, max = 80) => s.length > max ? s.slice(0, max) + "…" : s;
return <p title={texte}>{tronquer(texte)}</p>;
```

### Highlight (surligner un mot cherché)
```jsx
function Highlight({ texte, terme }) {
  if (!terme) return <span>{texte}</span>;
  const parts = texte.split(new RegExp(`(${terme})`, "gi"));
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === terme.toLowerCase()
          ? <mark key={i}>{p}</mark>
          : p
      )}
    </span>
  );
}
```

### HTML dans une string — dangerouslySetInnerHTML
```jsx
const html = "<strong>Bonjour</strong> <em>monde</em>";
// À n'utiliser que si la source est sûre (jamais avec du contenu utilisateur brut)
return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

### Props string
```jsx
// Ces deux sont équivalents
<Input placeholder={"Saisir un nom"} />
<Input placeholder="Saisir un nom" />

// Avec variable
<Input placeholder={`Chercher parmi ${total} résultats`} />
```

---

## 24. Recettes pratiques

### Tronquer
```js
const tronquer = (s, max = 50) =>
  s.length > max ? s.slice(0, max) + "…" : s;

tronquer("Un texte très long qui dépasse la limite fixée", 20);
// "Un texte très long q…"
```

### Slugifier (URL-friendly)
```js
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

slugify("Bonjour Tout le Monde !"); // "bonjour-tout-le-monde"
slugify("résumé professionnel");    // "resume-professionnel"
```

### Compter les occurrences
```js
const compter = (s, mot) =>
  (s.match(new RegExp(mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;

compter("chat chien chat", "chat"); // 2
```

### Inverser
```js
const inverser = (s) => [...s].join(""); // gère les emojis
// ou simplement :
"Bonjour".split("").reverse().join(""); // "ruojnoB"
```

### Palindrome
```js
const estPalindrome = (s) => {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === [...clean].reverse().join("");
};
estPalindrome("kayak");       // true
estPalindrome("A man a plan"); // false
```

### Masquer une string (mot de passe, carte)
```js
const masquer = (s, visible = 4) =>
  "*".repeat(Math.max(0, s.length - visible)) + s.slice(-visible);

masquer("1234567890123456", 4); // "************3456"
masquer("monmotdepasse", 2);   // "***********se"
```

### Extraire initiales
```js
const initiales = (nom) =>
  nom.trim().split(/\s+/).map((m) => m[0].toUpperCase()).join("");

initiales("Jean Pierre Dupont"); // "JPD"
```

### Générer un identifiant aléatoire
```js
Math.random().toString(36).slice(2, 10); // ex: "k4f2x9ab"
crypto.randomUUID(); // "550e8400-e29b-41d4-a716-446655440000"
```

### Interpolation sécurisée HTML (escape)
```js
const escapeHTML = (s) =>
  s.replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");

escapeHTML('<script>alert("xss")</script>');
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

### Comparer sans accents / casse
```js
const egalSansAccent = (a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

egalSansAccent("café", "CAFE"); // true
egalSansAccent("résumé", "resume"); // true
```

### Bytes d'une string UTF-8
```js
const byteLength = (s) => new TextEncoder().encode(s).length;
byteLength("Bonjour");  // 7
byteLength("café");     // 5 (é = 2 bytes)
byteLength("😀");       // 4
```

---

## Référence rapide

| Opération | Méthode / Syntaxe |
|---|---|
| Créer | `""`, `''`, `` ` `` `` ` ``, `String()` |
| Concaténer | `+`, `` `${a}${b}` ``, `.concat()`, `+=`, `.join()` |
| Longueur | `.length`, `[...s].length` (unicode) |
| Accéder | `s[i]`, `.charAt(i)`, `.at(i)`, `.at(-1)` |
| Code char | `.charCodeAt()`, `.codePointAt()`, `String.fromCharCode()`, `String.fromCodePoint()` |
| Contient | `.includes()`, `.startsWith()`, `.endsWith()` |
| Position | `.indexOf()`, `.lastIndexOf()`, `.search()` |
| Extraire | `.slice()`, `.substring()`, `.substr()` |
| Majuscule | `.toUpperCase()`, `.toLocaleUpperCase()` |
| Minuscule | `.toLowerCase()`, `.toLocaleLowerCase()` |
| Espacements | `.trim()`, `.trimStart()`, `.trimEnd()` |
| Remplacer | `.replace()`, `.replaceAll()` |
| Regex match | `.match()`, `.matchAll()`, `.test()` |
| Découper | `.split()` |
| Assembler | `.join()` |
| Répéter | `.repeat()` |
| Remplir | `.padStart()`, `.padEnd()` |
| Normaliser | `.normalize("NFD"/"NFC")` |
| Comparer | `.localeCompare()`, `===` |
| Encoder | `encodeURIComponent()`, `btoa()`, `atob()` |
| Convertir | `String()`, `Number()`, `parseInt()`, `parseFloat()`, `JSON.stringify()`, `JSON.parse()` |
| Formater | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `.toFixed()`, `.toPrecision()` |
| Raw | `String.raw\`...\`` |
| Multiline | `` `...\n...` `` |
| JSX | `{variable}`, `` {`${x}`} ``, `dangerouslySetInnerHTML` |
