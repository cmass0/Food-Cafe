import style from "./search.module.css";

export default function SearchList({ data, keyFn, children, query }) {
  const searchresults = data.filter((contents) =>
    JSON.stringify(contents).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={style.searchlist}>
      <ul>
        {searchresults.map((contents) => (
          <li key={keyFn(contents)}>{children(contents)}</li>
        ))}
      </ul>
    </div>
  );
}
