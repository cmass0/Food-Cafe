"use client";

import style from "./postboard.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MenuItem } from "@nextui-org/react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "@/data/firestore";
import Modal from "../modal/modal";
import LoadingPage from "@/app/loading";
import { async } from "@firebase/util";

export default function BoardMain({ data }, maxnum) {
  const [user] = useAuthState(Auth);

  let initarr = [];
  let startarr = [];
  let Boardinitarr = data.slice().reverse().slice(0, 10);
  const router = useRouter();
  const queryPage =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("page")
      : null;

  const [currentIndexArr, setcurrentIndexArr] = useState(startarr); // bottom
  const [currentPage, setCurrentPage] = useState(1); // bottom
  // const [gotoPage, setGotoPage] = useState(1);
  const [currentBoardArr, setcurrentBoardArr] = useState(Boardinitarr); // main
  const [selectedValue, setSelectedValue] = useState("제목");
  const [searchText, setSearchText] = useState("");
  const [isModal, setIsModal] = useState(false);

  let lastindex = Math.ceil(data.length / 10);

  useEffect(() => {
    if (!queryPage) {
      router.push(`?page=${currentPage}`, undefined, { shallow: true });
    }
  }, []);

  useEffect(() => {
    updateBoarddata(currentPage);
  }, [currentPage]);

  function updateBoarddata(currentPage) {
    const firstcontentindex = currentPage === 0 ? 0 : (currentPage - 1) * 10;
    const lastcontentindex = currentPage === 0 ? 9 : currentPage * 10 - 1;

    const setarr2 = data
      .slice()
      .reverse()
      .slice(
        firstcontentindex,
        data.length <= lastcontentindex ? data.length : lastcontentindex + 1
      );
    setcurrentBoardArr(setarr2);
  }

  if (data.length <= 100) {
    for (let i = 0; i < lastindex; i++) {
      startarr.push(i + 1);
    }
  } else {
    for (let i = 0; i < lastindex; i++) {
      initarr.push(i + 1);
    }
    for (let i = 0; i < 10; i++) {
      startarr.push(i + 1);
    }
  }

  function BeforeHD() {
    if (currentPage % 10 === 1 && currentPage !== 1 && lastindex >= 11) {
      const setarr = initarr.slice(currentPage - 11, currentPage - 1);

      setcurrentIndexArr(setarr);
    }
    if (currentPage === 1) {
      return;
    }
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  function AfterHD() {
    if (currentPage % 10 === 0 && lastindex >= 11) {
      const setarr = initarr.slice(
        currentPage,
        lastindex < currentPage + 10 ? lastindex : currentPage + 10
      );

      setcurrentIndexArr(setarr);
    }
    if (currentPage === lastindex) {
      return;
    }
    if (currentPage < lastindex) {
      setCurrentPage((prev) => prev + 1);
    }
  }

  useEffect(() => {
    if (currentPage && typeof window !== "undefined") {
      router.push(`?page=${currentPage}`);
    }
  }, [currentPage, router]);

  function CurPageHD(curpage, e) {
    e.preventDefault();
    setCurrentPage(curpage);
    // router.push(`?page=${curpage}`);
  }

  function postSearchHD(e) {
    e.preventDefault();
    console.log(e);
    let searchData = data.slice().reverse();

    if (selectedValue === "제목") {
      searchData = searchData.filter((contents) =>
        JSON.stringify(contents.title).toLowerCase().includes(searchText)
      );
      setcurrentBoardArr(searchData);
      // setcurrentIndexArr(searchData);
      setCurrentPage(1);
    }

    if (selectedValue === "작성자") {
      searchData = searchData.filter((contents) =>
        JSON.stringify(contents.writer).toLowerCase().includes(searchText)
      );
      setcurrentBoardArr(searchData);
      // setcurrentIndexArr(searchData);
      setCurrentPage(1);
    }
    if (selectedValue === "제목 + 작성자") {
      searchData = searchData.filter(
        (contents) =>
          JSON.stringify(contents.title).toLowerCase().includes(searchText) ||
          JSON.stringify(contents.writer).toLowerCase().includes(searchText)
      );
      setcurrentBoardArr(searchData);
      // setcurrentIndexArr(searchData);
      setCurrentPage(1);
    }
    // const newLastIndex = Math.ceil(searchData.length / 10);

    setcurrentBoardArr(searchData.slice(0, 10));
    // setcurrentIndexArr(newIndexArr);
    setCurrentPage(1);
  }

  function needlogin() {
    if (!user) {
      router.push("/commu");
      setIsModal(true);
    } else {
      router.push("/commu/writeform");
    }
  }

  function onclose() {
    setIsModal(false);
  }

  async function postclickHD(id) {
    console.log(id);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/post/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            check: "increment",
          }),
        }
      );
      console.log(response);

      if (!response.ok) {
        const errormsg = await response.text();
        throw new Error(`increment error: ${errormsg}`);
      }
    } catch (err) {
      console.log("err: ", err);
    }
  }

  return (
    <article className={style.commucontainer}>
      <div className={style.boardarea}>
        <form>
          <main className={style.boardmain}>
            <table className={style.boardtable}>
              <colgroup>
                <col width="150px" />
                <col width="600px" />
                <col width="150px" />
                <col width="100px" />
                <col width="100px" />
              </colgroup>
              <thead>
                <tr className={style.tableheader}>
                  <td align="center">번호</td>
                  <td align="center">제목</td>
                  <td align="center">글쓴이</td>
                  <td align="center">날짜</td>
                  <td align="center">조회</td>
                </tr>
              </thead>
              <tbody>
                <tr className={style.tablemain}>
                  <td align="center">공지</td>
                  <td>게시판 이용규칙</td>
                  <td align="center">admin</td>
                  <td align="center">2024-04-04</td>
                  <td align="center">-</td>
                </tr>
                {currentBoardArr.map((contents, index) => (
                  <tr className={style.tablemain} key={index}>
                    <td align="center">{contents.number}</td>
                    <td>
                      <Link
                        href={`/commu/${contents.id}`}
                        onClick={() => postclickHD(contents.id)}
                      >
                        {contents.title}
                      </Link>
                    </td>
                    <td align="center">{contents.writer}</td>
                    <td align="center">{contents.date.substring(0, 10)}</td>
                    <td align="center">{contents.check}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
        </form>
        <div className={style.writebtn}>
          <button onClick={needlogin}>글쓰기</button>
        </div>
      </div>
      <footer>
        <div className={style.boardindex}>
          <Link href="" onClick={BeforeHD}>
            이전
          </Link>
          {currentIndexArr.map((contents, index) => (
            <div className={style.highlightlinkbox} key={index}>
              <Link
                href=""
                onClick={(e) => CurPageHD(contents, e)}
                className={contents === currentPage ? style.highlightlink : ""}
              >
                {contents}
              </Link>
            </div>
          ))}

          <Link href="" onClick={AfterHD}>
            다음
          </Link>
        </div>

        <div className={style.selectcontainer}>
          <div>페이지 이동하기</div>
          <select
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value);
              setGotoPage(page);
              setCurrentPage(page);
            }}
          >
            {Array.from({ length: lastindex }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <form className={style.commufooter} onSubmit={postSearchHD}>
          <select
            className={style.selector}
            onChange={(e) => setSelectedValue(e.target.value)}
          >
            <option value="제목">제목</option>
            <option value="작성자">작성자</option>
            <option value="제목 + 작성자">제목 + 작성자</option>
          </select>
          <input
            type="text"
            className={style.boardsearch}
            onChange={(e) => setSearchText(e.target.value)}
          ></input>
          <button type="submit" className={style.boardsearchbtn}>
            검색
          </button>
        </form>
        <div className={style.boardindex}></div>
      </footer>

      {/* <Pagination
        curindexarr={currentIndexArr}
        curpage={currentPage}
        startarr={startarr}
      /> */}
      {isModal && (
        <Modal onclose={onclose}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={onclose}>
              X
            </button>
            <div className={style.modaltext}>로그인이 필요한 서비스입니다.</div>
          </div>
        </Modal>
      )}
    </article>
  );
}
