// "use client";

// import style from "./Pagination.module.css";
// import Link from "next/link";

// export default function Pagination(curindexarr, curpage, startarr) {
//   const [curindexarr, setcurrentIndexArr] = useState(startarr); // bottom
//   const [currentPage, setCurrentPage] = useState(1); // bottom
//   const [selectedValue, setSelectedValue] = useState("제목");

//   function postSearchHD(e) {
//     e.preventDefault();
//   }

//   function BeforeHD() {
//     if (currentPage % 10 === 1 && currentPage !== 1 && lastindex >= 11) {
//       const setarr = initarr.slice(currentPage - 11, currentPage - 1);
//       setcurrentIndexArr(setarr);
//     }
//   }

//   function AfterHD() {
//     if (currentPage % 10 === 0 && lastindex >= 11) {
//       const setarr = initarr.slice(
//         currentPage,
//         lastindex < currentPage + 10 ? lastindex : currentPage + 10
//       );

//       setcurrentIndexArr(setarr);
//     }
//   }

//   function CurPageHD(curpage) {
//     e.preventDefault();
//     setCurrentPage(curpage);
//   }

//   function postSearchHD(e) {
//     e.preventDefault();
//     console.log(e);

//     if (selectedValue === "제목") {
//     }

//     if (selectedValue === "작성자") {
//     }
//     if (selectedValue === "제목 + 작성자") {
//     }
//   }

//   return (
//     <footer>
//       <div className={style.boardindex}>
//         <Link
//           href={`/commu/${currentPage === 1 ? 1 : currentPage - 1}`}
//           onClick={BeforeHD}
//         >
//           이전
//         </Link>
//         {currentIndexArr.map((contents, index) => (
//           <div className={style.highlightlinkbox} key={index}>
//             <Link
//               href={`/commu/${contents}`}
//               onClick={() => CurPageHD(contents)}
//               className={contents === currentPage ? style.highlightlink : ""}
//             >
//               {contents}
//             </Link>
//           </div>
//         ))}
//         <Link
//           href={`/commu/${currentPage === 3 ? 3 : currentPage + 1}`}
//           onClick={AfterHD}
//         >
//           다음
//         </Link>
//       </div>
//       <form className={style.commufooter} onSubmit={postSearchHD}>
//         <select
//           className={style.selector}
//           onChange={(e) => setSelectedValue(e.target.value)}
//         >
//           <option value="제목">제목</option>
//           <option value="작성자">작성자</option>
//           <option value="제목 + 작성자">제목 + 작성자</option>
//         </select>
//         <input type="text" className={style.boardsearch}></input>
//         <button type="submit" className={style.boardsearchbtn}>
//           검색
//         </button>
//         {selectedValue}
//       </form>
//     </footer>
//   );
// }
