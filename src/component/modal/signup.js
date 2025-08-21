"use client";

// import style from "./loginform.module.css";
// import { useState } from "react";

// export default function LoginForm() {
//   const [UserId, setUserId] = useState("");
//   const [UserEmail, setUserEmail] = useState("");
//   const [UserPassword, setUserPassword] = useState("");

//   const signSubmitHD = (e) => {
//     e.preventDefault();
//   };

//   function idHandler(e) {
//     setUserId(e.target.value);
//   }

//   function PasswordHandler(e) {
//     setUserPassword(e.target.value);
//   }

//   function emailHandler(e) {
//     setUserEmail(e.target.value);
//   }

//   return (
//     <form onSubmit={signSubmitHD} className={style.loginform}>
//       <div>
//         <div className={style.formGroup}>
//           <input
//             type="text"
//             id="username"
//             value={UserId}
//             onChange={idHandler}
//             required
//             placeholder="아이디"
//           />
//         </div>
//         <div className={style.formGroup}>
//           <input
//             type="email"
//             id="email"
//             value={UserEmail}
//             onChange={emailHandler}
//             required
//             placeholder="이메일"
//           />
//         </div>
//         <div className={style.formGroup}>
//           <input
//             type="password"
//             id="password"
//             value={UserPassword}
//             onChange={PasswordHandler}
//             required
//             placeholder="비밀번호"
//           />
//         </div>
//       </div>
//       <div>
//         <div>
//           <input
//             type="name"
//             id="name"
//             value={UserPassword}
//             onChange={PasswordHandler}
//             required
//             placeholder="이름"
//           />
//         </div>
//         <div>
//           <input
//             type="birth"
//             id="birth"
//             value={UserPassword}
//             onChange={PasswordHandler}
//             required
//             placeholder="생년월일 8자리"
//           />
//         </div>
//         <div>
//           <input
//             type="tel"
//             id="tel"
//             value={UserPassword}
//             onChange={PasswordHandler}
//             required
//             placeholder="통신사"
//           />
//         </div>
//       </div>

//       <button type="submit" className={style.submitButton}>
//         회원가입
//       </button>
//     </form>
//   );
// }

import styles from "./signup.module.css";
import { useState } from "react";

export default function LoginForm() {
  const [UserId, setUserId] = useState("");
  const [UserEmail, setUserEmail] = useState("");
  const [UserPassword, setUserPassword] = useState("");
  const [UserName, setUserName] = useState("");
  const [UserBirth, setUserBirth] = useState("");
  const [UserTel, setUserTel] = useState("");
  const [UserGender, setUserGender] = useState("");
  const [UserNationality, setUserNationality] = useState("");

  const signSubmitHD = (e) => {
    e.preventDefault();
  };

  function idHandler(e) {
    setUserId(e.target.value);
  }

  function PasswordHandler(e) {
    setUserPassword(e.target.value);
  }

  function emailHandler(e) {
    setUserEmail(e.target.value);
  }

  function nameHandler(e) {
    setUserName(e.target.value);
  }

  function birthHandler(e) {
    setUserBirth(e.target.value);
  }

  function telHandler(e) {
    setUserTel(e.target.value);
  }

  function genderHandler(e) {
    setUserGender(e.target.value);
  }

  function nationalityHandler(e) {
    setUserNationality(e.target.value);
  }

  return (
    <div className={styles.loginFormModal}>
      <form onSubmit={signSubmitHD} className={styles.loginForm}>
        <h2 className={styles.heading}>회원가입</h2>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            아이디
          </label>
          <input
            type="text"
            id="username"
            value={UserId}
            onChange={idHandler}
            required
            placeholder="아이디"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            이메일
          </label>
          <input
            type="email"
            id="email"
            value={UserEmail}
            onChange={emailHandler}
            required
            placeholder="이메일"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            value={UserPassword}
            onChange={PasswordHandler}
            required
            placeholder="비밀번호"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            이름
          </label>
          <input
            type="text"
            id="name"
            value={UserName}
            onChange={nameHandler}
            required
            placeholder="이름"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="birth" className={styles.label}>
            생년월일
          </label>
          <input
            type="text"
            id="birth"
            value={UserBirth}
            onChange={birthHandler}
            required
            placeholder="생년월일 8자리"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="tel" className={styles.label}>
            통신사
          </label>
          <input
            type="text"
            id="tel"
            value={UserTel}
            onChange={telHandler}
            required
            placeholder="통신사"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>성별</label>
          <div className={styles.radioGroup}>
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="male"
                value="male"
                checked={UserGender === "male"}
                onChange={genderHandler}
                className={styles.radio}
              />
              <label htmlFor="male" className={styles.radioLabel}>
                남자
              </label>
            </div>
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="female"
                value="female"
                checked={UserGender === "female"}
                onChange={genderHandler}
                className={styles.radio}
              />
              <label htmlFor="female" className={styles.radioLabel}>
                여자
              </label>
            </div>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>국적</label>
          <div className={styles.radioGroup}>
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="domestic"
                value="domestic"
                checked={UserNationality === "domestic"}
                onChange={nationalityHandler}
                className={styles.radio}
              />
              <label htmlFor="domestic" className={styles.radioLabel}>
                내국인
              </label>
            </div>
            <div className={styles.radioOption}>
              <input
                type="radio"
                id="foreign"
                value="foreign"
                checked={UserNationality === "foreign"}
                onChange={nationalityHandler}
                className={styles.radio}
              />
              <label htmlFor="foreign" className={styles.radioLabel}>
                외국인
              </label>
            </div>
          </div>
        </div>
        <div className={styles.btnarea}>
          <button type="submit" className={styles.submitButton}>
            회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
