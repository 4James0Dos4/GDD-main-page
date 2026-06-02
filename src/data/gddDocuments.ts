import daneRejestrowe from "./documents/02-dane-rejestrowe.txt?raw";
import politykaPrywatnosci from "./documents/06-polityka-prywatnosci.txt?raw";
import regulaminOgolny from "./documents/03-regulamin-ogolny.txt?raw";
import regulaminOnline from "./documents/04-regulamin-online.txt?raw";
import regulaminStacjonarny from "./documents/05-regulamin-stacjonarny.txt?raw";
import statut from "./documents/01-statut.txt?raw";
import type { DocumentSection } from "../lib/documentUtils";

export const gddDocumentSections: DocumentSection[] = [
  {
    id: "statut",
    number: "01",
    title: "Statut Fundacji",
    body: statut,
  },
  {
    id: "dane-rejestrowe",
    number: "02",
    title: "Dane rejestrowe i konta",
    body: daneRejestrowe,
  },
  {
    id: "regulamin-ogolny",
    number: "03",
    title: "Regulamin ogólny",
    body: regulaminOgolny,
  },
  {
    id: "regulamin-online",
    number: "04",
    title: "Regulamin warsztatów online",
    body: regulaminOnline,
  },
  {
    id: "regulamin-stacjonarny",
    number: "05",
    title: "Regulamin warsztatów stacjonarnych",
    body: regulaminStacjonarny,
  },
  {
    id: "polityka-prywatnosci",
    number: "06",
    title: "Polityka prywatności",
    body: politykaPrywatnosci,
  },
];
