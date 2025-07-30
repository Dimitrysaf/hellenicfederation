export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export const faqs: FAQ[] = [
  {
    "id": "2",
    "question": "Ποια είναι η σημασία του Συντάγματος;",
    "answer": "Το Σύνταγμα είναι οι κανόνες του παιχνιδιού. Καθορίζουν ΠΩΣ θα γίνουν πράγματα και με τι. Επίσης καθορίζει τι δικαιώματα έχει ο Έλληνας και τι μπορεί να κάνει σε νομικά πλαίσια.",
    "order": 1
  },
  {
    "id": "1",
    "question": "Τι είναι το Σύνταγμα;",
    "answer": "aa",
    "order": 2
  }
];
