import { populate } from "dotenv";
import User from "../models/User";
import Video from "../models/Video";
import bcrypt from "bcrypt";

//회원가입
export const getJoin = (req, res) => {
  res.render("users/join", { pageTitle: "Join" });
};
export const postJoin = async (req, res) => {
  const { name, email, username, password, password2, location } = req.body;
  if (password !== password2) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: "password confirm does not match",
    });
  }
  const exists = await User.exists({
    $or: [{ username: req.body.username }, { email }],
  });
  if (exists) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: "this username/email is already taken",
    });
  }
  try {
    await User.create({
      name,
      email,
      username,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

//로그인,로그아웃
export const getLogin = (req, res) => {
  res.render("users/login", { pageTitle: "login" });
};
export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  //계정 있나?
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render("users/login", {
      pageTitle: "login",
      errorMessage: "An Account with this username doesn't exists",
    });
  }
  //패스워드 맞나?
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("users/login", {
      pageTitle: "login",
      errorMessage: "Wrong password",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};
export const logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};

//회원정보
export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found" });
  }
  return res.render("users/profile", { pageTitle: user.name, user });
};

//프로필 수정, 패스워드 수정
export const getEdit = (req, res) => {
  return res.render("users/edit-profile", { pageTitle: "edit profile" });
};
export const postEdit = async (req, res) => {
  const id = req.session.user._id;
  const avatarUrl = req.session.user.avatarUrl;
  const file = req.file;
  const { name, email, username, location } = req.body;

  if (username != req.session.user.username) {
    const exists = await User.exists({ username });
    if (exists) {
      return res.status(400).render("users/edit-profile", {
        pageTitle: "edit profile",
        errorMessage: "this username is already taken",
      });
    }
  }

  if (email != req.session.user.email) {
    const exists = await User.exists({ email });
    if (exists) {
      return res.status(400).render("users/edit-profile", {
        pageTitle: "edit profile",
        errorMessage: "this email is already taken",
      });
    }
  }

  const updateUser = await User.findByIdAndUpdate(
    id,
    {
      avatarUrl: file ? file.path : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updateUser;
  return res.redirect("/users/edit");
};
export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "change password" });
};
export const postChangePassword = async (req, res) => {
  const id = req.session.user._id;
  const password = req.session.user.password;
  const { oldPassword, newPassword, newPassword2 } = req.body;
  if (newPassword != newPassword2) {
    return res.status(400).render("users/change-password", {
      pageTitle: "change password",
      errorMessage: "the password does not match the confirmation",
    });
  }
  const ok = await bcrypt.compare(oldPassword, password);
  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "change password",
      errorMessage: "the current password is not correct",
    });
  }
  const user = await User.findById(id);
  user.password = newPassword;
  await user.save(); // 해시 미들웨어가 save 시 작용하기 때문
  req.session.user.password = user.password;
  return res.redirect("/users/logout");
};

export const remove = (req, res) => {
  res.send("remove");
};

//깃허브 로그인
export const startGithublogin = (req, res) => {
  const baseUrl = `https://github.com/login/oauth/authorize`;
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};
export const finishGithublogin = async (req, res) => {
  const baseUrl = `https://github.com/login/oauth/access_token`;
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const data = await fetch(finalUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  const tokenRequest = await data.json(); //토큰줘 끝

  if ("access_token" in tokenRequest) {
    //토큰 확인받고 사용자 데이터 가져옴
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailData = await //이메일 비공개일 시를 위한..
    (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      // 이메일 없을 때 다시 로그인페이지로 돌아감
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        //유저 생성
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};
