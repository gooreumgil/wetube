import passport from "passport";
import routes from "../routes";
import User from "../models/User";

export const getJoin = (req, res) => {
  res.render("join", { pageTitle: "Join" });
};

export const postJoin = async (req, res, next) => {
  const {
    body: { name, email, password, password2 }
  } = req;
  if (password !== password2) {
    res.status(400);
    res.render("join", { pageTitle: "join" });
  } else {
    try {
      const user = await User({
        name,
        email
      });
      await User.register(user, password);
      console.log(user);
      next();
    } catch (error) {
      console.log(error);
      res.redirect(routes.home);
    }
    // To Do: Log user in
  }
};

export const getLogin = (req, res) => {
  res.render("login", { pageTitle: "Log In" });
};

// export const postLogin = passport.authenticate("local", {
//   failureRedirect: routes.login,
//   successRedirect: routes.home
// });

export const postLogin = (req, res, next) => {
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect("/login");
    }

    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/");
    });
  })(req, res, next);
};

export const githubLogin = passport.authenticate("github");

export const githubLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  cb
) => {
  const {
    _json: { id, avatar_url, name, email }
  } = profile;
  console.log(profile);
  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (user) {
      user.githubId = id;
      user.save();
      return cb(null, user);
    } else {
      const newUser = await User.create({
        email,
        name,
        githubId: id,
        avataUrl: avatar_url
      });
      return cb(null, newUser);
    }
  } catch (error) {
    return cb(error);
  }
};

export const postGithubLogin = (req, res) => {
  res.redirect(routes.home);
};

export const facebookLogin = passport.authenticate("facebook");

export const facebookLoginCallback = async (
  accessToken,
  refreshToken,
  profile,
  cb
) => {
  try {
    const {
      _json: { id, name, email }
    } = profile;
    const user = await User.findOne({ email });
    if (user) {
      user.facebookId = id;
      user.save();
      return cb(null, user);
    }
    const newUser = await User.create({
      email,
      name,
      fackbookId: id,
      avataUrl: `http://graph.facebook.com/${id}/picture?type=large`
    });
    return cb(null, user);
  } catch (error) {
    return cb(error);
  }
};

export const postFacebookLogin = (req, res) => {
  res.redirect(routes.home);
};

export const logout = (req, res) => {
  req.logout();
  res.redirect(routes.home);
};

export const getMe = async (req, res) => {
  // req.user = 세션유저

  try {
    if (!req.user) {
      throw Error();
    }

    const user = await User.findById(req.user.id).populate("videos");
    res.render("userDetail", { pageTitle: "Me", user });
  } catch (error) {
    res.redirect(routes.home);
  }
};

export const userDetail = async (req, res) => {
  try {
    const {
      params: { id }
    } = req;
    const user = await User.findById(id).populate("videos");
    console.log(user);
    res.render("userDetail", { pageTitle: "User Detail", user });
  } catch (error) {
    console.error("[ERROR]", error);
    res.redirect(routes.home);
  }
};

export const getEditProfile = (req, res) => {
  res.render("editProfile", { pageTitle: "Edit Profile" });
};

export const postEditProfile = async (req, res) => {
  try {
    const {
      body: { name, email },
      file
    } = req;
    await User.findByIdAndUpdate(req.user.id, {
      name,
      email,
      avataUrl: file ? file.location : req.user.avataUrl
    });
    res.redirect(routes.getMe);
  } catch (error) {
    res.redirect(routes.editProfile);
  }
};

export const getChangePassword = (req, res) => {
  res.render("changePassword", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  try {
    const {
      body: { oldPassword, newPassword, newPassword1 }
    } = req;
    if (newPassword !== newPassword1) {
      res.status(400);
      res.redirect(`/users${routes.changePassword}`);
      return;
    }
    console.log(req.user);
    await req.user.changePassword(oldPassword, newPassword);
    res.redirect(routes.getMe);
  } catch (error) {
    res.status(400);
    res.redirect(`/users${routes.changePassword}`);
  }
};
