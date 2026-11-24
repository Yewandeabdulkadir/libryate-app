export function SearchBar({ defaultValue, subject }: { defaultValue?: string; subject?: string }) {
  return (
    <form action="/search" role="search" className="searchbar">
      <label htmlFor="q" className="sr-only">
        Search books
      </label>
      <input id="q" type="search" name="q" placeholder="Title, author, subject or keyword" defaultValue={defaultValue} minLength={2} required />
      {subject && <input type="hidden" name="subject" value={subject} />}
      <button className="btn" type="submit">
        Search
      </button>
    </form>
  );
}
