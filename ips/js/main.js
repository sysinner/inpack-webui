var inpack = {
    base: "/ips/",
    api: "/ips/v1/",
    nav_reged: false,
    channel_def: {
        kind: "PackChannel",
        meta: {
            name: "",
        },
        vendor_name: "",
        vendor_api: "http://example.com/ips/v1",
        vendor_site: "http://example.com",
    },
    cc_channels: null,
    cc_groups: null,
    infols_grpactive: "",
    infols_grpvalue: "Groups",
    pkgls_pkgactive: null,
    pkgls_chanactive: "",
    pkgls_chanvalue: "Channels",
    option_dstid: "comp-content",
    option_navpf: "inpack",
    OpPermRead: 1 << 0,
    OpPermWrite: 1 << 1,
    OpPermCreate: 1 << 2,
    OpPermDelete: 1 << 3,
    OpPermList: 1 << 4,
    OpPermOff: 1 << 5,
    Status: {
        user_channel_write: false,
    },
    iamAppRoles: null,
    nav_back: null,
    pkginfo_list_optools_style: null,
    UserSession: null,
};

inpack.path = function (uri) {
    return inpack.base + uri;
};

inpack.apipath = function (uri) {
    return inpack.api + uri;
};

inpack.tplpath = function (uri) {
    return inpack.base + "tpl/" + uri + ".html";
};

inpack.OpPermAllow = function (p, perms) {
    return (perms & p) == perms;
};

inpack.tplWorkLoader = function (uri) {
    valueui.utilx.Ajax(inpack.tplpath(uri), {
        callback: function (err, data) {
            if (err) {
                return;
            }

            $("#work-content").html(data);
        },
    });
};

inpack.NavBack = function (fn) {
    if (fn && typeof fn === "function") {
        inpack.nav_back = fn;
        $("#ipscp-navbar-back").css({
            display: "block",
        });
        return;
    }

    if (inpack.nav_back) {
        inpack.nav_back();
        inpack.nav_back = null;
        $("#ipscp-navbar-back").css({
            display: "nono",
        });
    }
};

inpack.Index = function (options) {
    var divstr =
        "<div id='" +
        inpack.option_navpf +
        "-module-navbar'>\
  <ul id='ipscp-navbar' class='" +
        inpack.option_navpf +
        "-module-nav'>\
    <li id='ipscp-navbar-back' style='display:none'><a class='valueui-nav-item primary' href='#ips/back' onclick='inpack.NavBack()'>\
      <span class='glyphicon glyphicon-menu-left' aria-hidden='true'></span> Back\
      </a>\
    </li>\
    <li><a class='valueui-nav-item' href='#ips/pkginfo'>Packages</a></li>\
    <li><a class='valueui-nav-item' href='#ips/channel'>Channels</a></li>\
  </ul>\
  <ul id='" +
        inpack.option_navpf +
        "-module-navbar-optools' class='" +
        inpack.option_navpf +
        "-module-nav " +
        inpack.option_navpf +
        "-nav-right'></ul>\
</div>\
<div id='work-content'></div>";

    $("#" + inpack.option_dstid).html(divstr);

    if (!inpack.nav_reged) {
        valueui.url.EventRegister("ips/pkginfo", inpack.InfoListRefresh, "ipscp-navbar");
        valueui.url.EventRegister("ips/channel", inpack.ChannelListRefresh, "ipscp-navbar");
        inpack.nav_reged = true;
    }

    if (options && options.dstid) {
        inpack.option_dstid = options.dstid;
    }
    if (!inpack.pkginfo_list_optools_style) {
        inpack.pkginfo_list_optools_style = valueui.storage.Get("pkginfo_list_optools_style");
    }

    var ep = valueui.NewEventProxy("info", function (info) {
        if (info && info.user_channel_write === true) {
            inpack.Status.user_channel_write = true;
        }
        valueui.url.EventHandler("ips/pkginfo", true);
    });

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    valueui.utilx.Ajax(inpack.apipath("status/info"), {
        callback: ep.done("info"),
    });
};

inpack.InfoListRefresh = function (tplid, optools_off) {
    $("#ipscp-navbar-back").css({
        display: "none",
    });
    if (!tplid || tplid.indexOf("/") >= 0) {
        tplid = "ips-infols";
    }
    var alert_id = "#" + tplid + "-alert",
        uri = "?";

    if (document.getElementById(tplid)) {
        var q = $("#" + tplid + "-qry-text").val();
        if (q) {
            uri += "q=" + q;
        }
        if (inpack.infols_grpactive && inpack.infols_grpactive != "") {
            uri += "&group=" + inpack.infols_grpactive;
        }
    }

    var ep = valueui.NewEventProxy(
        "tpl",
        "channels",
        "groups",
        "info",
        function (tpl, channels, groups, info) {
            if (tpl) {
                $("#work-content").html(tpl);
            }

            if (!channels || !channels.items || channels.items.length < 1) {
                if (inpack.Status.user_channel_write === true) {
                    return $("#ips-channel-set-alert").css({
                        display: "block",
                    });
                }
                return valueui.alert.InnerShow(
                    alert_id,
                    "alert-danger",
                    "No available, or authorized channels can be accessed"
                );
            }

            if (!optools_off) {
                inCp.OpToolsRefresh("#ips-infols-optools", function () {
                    if (inpack.pkginfo_list_optools_style == "th") {
                        $("#pkginfo-list-navstyle-list").removeClass("hover");
                        $("#pkginfo-list-navstyle-th").addClass("hover");
                    } else {
                        $("#pkginfo-list-navstyle-list").addClass("hover");
                        $("#pkginfo-list-navstyle-th").removeClass("hover");
                    }
                });
            }

            if (!groups.items || groups.items.length < 1) {
                return $("#" + tplid + "-empty-alert").css({
                    display: "block",
                });
            }

            if (!info || (!info.error && !info.kind)) {
                return valueui.alert.InnerShow(alert_id, "alert-danger", "Network Error");
            }

            if (info.kind != "PackInfoList" || !info.items) {
                info.items = [];
            }

            if (info.items.length > 0) {
                $("#" + tplid + "-empty-alert").css({
                    display: "none",
                });
            } else {
                $("#" + tplid + "-empty-alert").css({
                    display: "block",
                });
            }
            for (var i in info.items) {
                if (!info.items[i].op_perm) {
                    info.items[i].op_perm = 0;
                }
                var gs = [];
                for (var j in info.items[i].groups) {
                    for (var k in groups.items) {
                        if (info.items[i].groups[j] == groups.items[k].name) {
                            gs.push(groups.items[k].value);
                            break;
                        }
                    }
                }
                info.items[i]._groups_value = gs;
            }

            var list_cb = function () {
                var dstid_nav = tplid + "-grpnav";
                if (inpack.pkginfo_list_optools_style == "th") {
                    dstid_nav = tplid + "-grpnav-th";
                    $("#ips-infols-grpnav-th").css({
                        display: "block",
                    });
                } else {
                    $("#ips-infols-grpnav-th").css({
                        display: "none",
                    });
                    $("#" + tplid + "-grpnav-th").empty();
                }
                var elem = document.getElementById(dstid_nav);
                if (elem && elem.innerHTML.length > 50) {
                    return;
                }
                valueui.template.Render({
                    dstid: dstid_nav,
                    tplid: tplid + "-grpnav-tpl",
                    data: {
                        groups: groups.items,
                        grpname: inpack.infols_grpactive,
                        grpvalue: inpack.infols_grpvalue,
                    },
                });
            };

            // refresh info list
            var tplid_style = tplid + "-tpl";
            if (inpack.pkginfo_list_optools_style == "th") {
                tplid_style = tplid + "-th-tpl";
            }
            valueui.template.Render({
                dstid: tplid,
                tplid: tplid_style,
                data: {
                    _api_url: inpack.api,
                    items: info.items,
                    groups: groups.items,
                },
                callback: list_cb,
            });

            if (!inpack.cc_channels) {
                inpack.cc_channels = channels;
            }
            if (!inpack.cc_groups) {
                inpack.cc_groups = groups;
            }
        }
    );

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    if (document.getElementById(tplid)) {
        ep.emit("tpl", null);
    } else {
        valueui.utilx.Ajax(inpack.tplpath("pkginfo/list"), {
            callback: ep.done("tpl"),
        });
    }

    if (inpack.cc_channels && inpack.cc_channels.items.length > 0) {
        ep.emit("channels", inpack.cc_channels);
    } else {
        valueui.utilx.Ajax(inpack.apipath("channel/list"), {
            callback: ep.done("channels"),
        });
    }

    if (inpack.cc_groups && inpack.cc_groups.items.length > 0) {
        ep.emit("groups", inpack.cc_groups);
    } else {
        valueui.utilx.Ajax(inpack.apipath("group/list"), {
            callback: ep.done("groups"),
        });
    }

    valueui.utilx.Ajax(inpack.apipath("pkg-info/list" + uri), {
        callback: ep.done("info"),
    });
};

inpack.InfoListStyle = function (s) {
    if (!s || s == inpack.pkginfo_list_optools_style) {
        return;
    }
    inpack.pkginfo_list_optools_style = s;
    valueui.storage.Set("pkginfo_list_optools_style", s);
    inpack.InfoListRefresh();
};

inpack.InfoPackList = function (name) {
    inpack.NavBack(inpack.InfoListRefresh);
    inpack.PackListRefresh(null, name);
};

inpack.InfoListGroupSelector = function () {
    valueui.modal.Open({
        title: "Select Group",
        width: 960,
        height: "max",
        tplid: "ips-infols-grp-selector-tpl",
        data: inpack.cc_groups,
        buttons: [
            {
                onclick: "valueui.modal.Close()",
                title: "Close",
            },
        ],
    });
};

inpack.InfoListGroupSelect = function (grp_name, grp_value) {
    valueui.modal.Close();
    if (!grp_name) {
        grp_name = "";
    }
    if (!grp_value) {
        grp_value = "Groups";
    }
    inpack.infols_grpactive = grp_name;
    inpack.infols_grpvalue = grp_value;

    $("#ips-infols-qry-grpvalue").text(grp_value);

    inpack.InfoListRefresh();
};

inpack.InfoSet = function (name) {
    var ep = valueui.NewEventProxy("tpl", "data", function (tpl, data) {
        if (!data || data.kind != "PackInfo") {
            return;
        }

        // $("#work-content").html(tpl);
        if (!data.project.description) {
            data.project.description = "";
        }

        valueui.modal.Open({
            title: "Package Info Settings",
            width: 800,
            height: 450,
            tplsrc: tpl,
            success: function () {
                valueui.template.Render({
                    dstid: "ips-infoset",
                    tplid: "ips-infoset-tpl",
                    data: {
                        info: data,
                    },
                });
            },
            buttons: [
                {
                    onclick: "valueui.modal.Close()",
                    title: "Close",
                },
                {
                    onclick: "inpack.InfoSetCommit()",
                    title: "Save",
                    style: "btn-primary",
                },
            ],
        });
    });

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    valueui.utilx.Ajax(inpack.apipath("pkg-info/entry?name=" + name), {
        callback: ep.done("data"),
    });

    valueui.utilx.Ajax(inpack.tplpath("pkginfo/set"), {
        callback: ep.done("tpl"),
    });
};

inpack.InfoSetCommit = function () {
    var form = $("#ips-infoset"),
        alertid = "#ips-infoset-alert";
    var req = {
        meta: {
            name: form.find("input[name=name]").val(),
        },
        project: {
            description: form.find("textarea[name=project_description]").val(),
        },
    };

    valueui.utilx.Ajax(inpack.apipath("pkg-info/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function (err, rsj) {
            if (err) {
                return valueui.alert.InnerShow(alertid, "alert-danger", err);
            }

            if (!rsj || rsj.kind != "PackInfo") {
                var msg = "Bad Request";
                if (rsj.error) {
                    msg = rsj.error.message;
                }

                return valueui.alert.InnerShow(alertid, "alert-danger", msg);
            }

            valueui.alert.InnerShow(alertid, "alert-success", "Successful operation");

            window.setTimeout(function () {
                valueui.modal.Close();
                inpack.InfoListRefresh();
            }, 1000);
        },
    });
};

inpack.InfoView = function (name) {
    var ep = valueui.NewEventProxy(
        "tpl",
        "data",
        "pkgs",
        "groups",
        function (tpl, data, pkgs, groups) {
            if (!data || data.kind != "PackInfo") {
                return;
            }

            if (pkgs.items) {
                data._packages = pkgs.items;
            } else {
                data._packages = [];
            }

            if (!data.project.description) {
                data.project.description = "";
            }
            if (groups.items) {
                data._groups = groups.items;
            } else {
                data._groups = [];
            }
            data._api_url = inpack.api;

            valueui.modal.Open({
                title: "Pack Info : " + data.meta.name,
                width: 900,
                height: 600,
                tplsrc: tpl,
                data: data,
                buttons: [
                    {
                        onclick: "valueui.modal.Close()",
                        title: "Close",
                    },
                ],
            });
        }
    );

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    valueui.utilx.Ajax(inpack.apipath("pkg-info/entry?name=" + name), {
        callback: ep.done("data"),
    });

    valueui.utilx.Ajax(inpack.apipath("pkg/list?name=" + name), {
        callback: ep.done("pkgs"),
    });

    if (inpack.cc_groups && inpack.cc_groups.items.length > 0) {
        ep.emit("groups", inpack.cc_groups);
    } else {
        valueui.utilx.Ajax(inpack.apipath("group/list"), {
            callback: ep.done("groups"),
        });
    }

    valueui.utilx.Ajax(inpack.tplpath("pkginfo/view"), {
        callback: ep.done("tpl"),
    });
};

inpack.PackNew = function () {
    var ep = valueui.NewEventProxy("tpl", "channels", function (tpl, channels) {
        if (!channels.items || channels.items.length < 1) {
            return inpack.ChannelSet();
        }

        $("#work-content").html(tpl);

        valueui.template.Render({
            dstid: "ips-pkgnew",
            tplid: "ips-pkgnew-tpl",
            data: {
                channels: channels.items,
            },
        });
    });

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    if (inpack.cc_channels) {
        ep.emit("channels", inpack.cc_channels);
    } else {
        valueui.utilx.Ajax(inpack.apipath("channel/list"), {
            callback: ep.done("channels"),
        });
    }

    valueui.utilx.Ajax(inpack.tplpath("pkg/new"), {
        callback: ep.done("tpl"),
    });
};

inpack.PackNewCommit = function () {
    var files = document.getElementById("ips-pkgnew-file").files,
        alertid = "#ips-pkgnew-alert";

    if (!files.length) {
        valueui.alert.InnerShow(alertid, "alert-danger", "Please select a file");
        return;
    }

    for (var i = 0, file; (file = files[i]); i++) {
        if (file.size > 100 * 1024 * 1024) {
            valueui.alert.InnerShow(alertid, "alert-danger", "The file is too large to upload");
            return;
        }

        var reader = new FileReader();

        reader.onload = (function (file) {
            return function (e) {
                if (e.target.readyState != FileReader.DONE) {
                    return;
                }

                var req = {
                    kind: "PackCommit",
                    size: file.size,
                    name: file.name,
                    data: e.target.result,
                    sumcheck: "sha1:TODO",
                    channel: $("#ips-pkgnew").find("select[name=channel]").val(),
                };

                valueui.utilx.Ajax(inpack.apipath("pkg/commit"), {
                    method: "POST",
                    data: JSON.stringify(req),
                    timeout: 600000,
                    callback: function (err, rsj) {
                        if (err || !rsj) {
                            if (err) {
                                return valueui.alert.InnerShow(alertid, "alert-danger", err);
                            }
                            if (rsj && rsj.error) {
                                return valueui.alert.InnerShow(
                                    alertid,
                                    "alert-danger",
                                    rsj.error.message
                                );
                            }
                            return valueui.alert.InnerShow(
                                alertid,
                                "alert-danger",
                                "Can not connect service"
                            );
                        }

                        if (rsj.error) {
                            valueui.alert.InnerShow(alertid, "alert-danger", rsj.error.message);
                            return;
                        }

                        if (rsj.kind != "PackCommit") {
                            valueui.alert.InnerShow(alertid, "alert-danger", "unknown error");
                            return;
                        }

                        valueui.alert.InnerShow(alertid, "alert-success", "Successfully commit");

                        window.setTimeout(function () {
                            inpack.tplWorkLoader("pkginfo/list");
                        }, 1000);
                    },
                });
            };
        })(file);

        reader.readAsDataURL(file);
    }
};

inpack.PackList = function () {
    inpack.pkgls_pkgactive = null;
    inpack.pkgls_chanactive = "";
    inpack.pkgls_chanvalue = "Channels";
    inpack.PackListRefresh();
};

inpack.PackListRefresh = function (tplid, pkgname, optools_off) {
    if (pkgname) {
        inpack.pkgls_pkgactive = pkgname;
    }

    if (!tplid || tplid.indexOf("/") >= 0) {
        tplid = "ips-pkgls";
    }
    var alert_id = "#" + tplid + "-alert",
        uri = "?";
    if (inpack.pkgls_pkgactive) {
        uri += "name=" + inpack.pkgls_pkgactive;
    }

    if (document.getElementById(tplid)) {
        var q = $("#" + tplid + "-qry-text").val();
        if (q) {
            uri += "&q=" + q;
        }
        if (inpack.pkgls_chanactive && inpack.pkgls_chanactive != "") {
            uri += "&channel=" + inpack.pkgls_chanactive;
        }
    }

    var ep = valueui.NewEventProxy("tpl", "channels", "pkgls", function (tpl, channels, pkgls) {
        if (tpl) {
            $("#work-content").html(tpl);
        }
        if (!optools_off) {
            inCp.OpToolsRefresh("#ips-pkgls-optools");
        }

        if (!channels || !channels.items) {
            channels.items = [];
        }

        if (!pkgls || !pkgls.kind || pkgls.kind != "PackList" || !pkgls.items) {
            pkgls.items = [];
        }

        if (pkgls.items.length > 0) {
            $(alert_id).css({
                display: "none",
            });
        } else {
            $(alert_id).css({
                display: "block",
            });
        }

        if (inpack.pkgls_pkgactive) {
            $("#ips-pkgls-ui-hname").css({
                display: "none",
            });
        }

        valueui.template.Render({
            dstid: tplid,
            tplid: tplid + "-tpl",
            data: {
                _pkgactive: inpack.pkgls_pkgactive,
                items: pkgls.items,
                channels: channels.items,
            },
        });

        if (tpl) {
            valueui.template.Render({
                dstid: tplid + "-chans",
                tplid: tplid + "-chans-tpl",
                data: {
                    chanactive: inpack.pkgls_chanactive,
                    chanvalue: inpack.pkgls_chanvalue,
                    // items: channels.items,
                },
            });
        }
        if (!inpack.cc_channels && channels.items.length > 0) {
            inpack.cc_channels = channels;
        }
    });

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    if (document.getElementById(tplid)) {
        ep.emit("tpl", null);
    } else {
        valueui.utilx.Ajax(inpack.tplpath("pkg/list"), {
            callback: ep.done("tpl"),
        });
    }

    if (inpack.cc_channels && inpack.cc_channels.items.length > 0) {
        ep.emit("channels", inpack.cc_channels);
    } else {
        valueui.utilx.Ajax(inpack.apipath("channel/list"), {
            callback: ep.done("channels"),
        });
    }

    valueui.utilx.Ajax(inpack.apipath("pkg/list" + uri), {
        callback: ep.done("pkgls"),
    });
};

inpack.PackListChannelSelector = function () {
    valueui.modal.Open({
        title: "Select Channel",
        width: 900,
        height: 300,
        tplid: "ips-pkgls-chans-selector-tpl",
        data: {
            items: inpack.cc_channels.items,
            chanactive: inpack.pkgls_chanactive,
            chanvalue: inpack.pkgls_chanvalue,
        },
        buttons: [
            {
                onclick: "valueui.modal.Close()",
                title: "Close",
            },
        ],
    });
};

inpack.PackListChannelSelect = function (chan_name, value) {
    valueui.modal.Close();

    if (!chan_name) {
        chan_name = "";
    }
    inpack.pkgls_chanactive = chan_name;
    if ((!value || value.length < 1) && chan_name.length < 1) {
        inpack.pkgls_chanvalue = "Channels";
    } else {
        inpack.pkgls_chanvalue = chan_name;
    }

    $("#ips-pkgls-qry-chanvalue").text(inpack.pkgls_chanvalue);

    inpack.PackListRefresh();
};

inpack.PackSet = function (id) {
    var ep = valueui.NewEventProxy("tpl", "channels", "pkg", function (tpl, channels, pkg) {
        if (!pkg || pkg.kind != "Pack") {
            return;
        }

        if (!channels.items || channels.items.length < 1) {
            return;
        }

        var actives = [
            {
                name: "Active",
                value: "on",
            },
            {
                name: "Deprecated",
                value: "off",
            },
        ];
        if (inpack.OpPermAllow(pkg.op_perm, inpack.OpPermOff)) {
            actives[1].action = true;
        } else {
            actives[0].action = true;
        }

        valueui.modal.Open({
            title: "Package Settings",
            width: 600,
            height: 400,
            tplsrc: tpl,
            success: function () {
                valueui.template.Render({
                    dstid: "ips-pkgset",
                    tplid: "ips-pkgset-tpl",
                    data: {
                        channels: channels,
                        pkg: pkg,
                        actives: actives,
                    },
                });
            },
            buttons: [
                {
                    onclick: "valueui.modal.Close()",
                    title: "Close",
                },
                {
                    onclick: "inpack.PackSetCommit()",
                    title: "Save",
                    style: "btn-primary",
                },
            ],
        });

        if (!inpack.cc_channels) {
            lpLos.cc_channels = channels;
        }
    });

    ep.fail(function (err) {
        alert("Network Abort, Please try again later");
    });

    if (inpack.cc_channels && inpack.cc_channels.items.length > 0) {
        ep.emit("channels", inpack.cc_channels);
    } else {
        valueui.utilx.Ajax(inpack.apipath("channel/list"), {
            callback: ep.done("channels"),
        });
    }

    valueui.utilx.Ajax(inpack.apipath("pkg/entry?id=" + id), {
        callback: ep.done("pkg"),
    });

    valueui.utilx.Ajax(inpack.tplpath("pkg/set"), {
        callback: ep.done("tpl"),
    });
};

inpack.PackSetCommit = function () {
    var alertid = "#ips-pkgset-alert",
        form = $("#ips-pkgset");
    if (!form) {
        return;
    }

    var req = {
        meta: {
            id: form.find("input[name=id]").val(),
        },
        channel: form.find("select[name=channel]").val(),
    };

    var op_perm_active = form.find("input[name=op_perm_active]:checked").val();
    if (op_perm_active == "off") {
        req.op_perm = inpack.OpPermOff;
    }

    valueui.utilx.Ajax(inpack.apipath("pkg/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function (err, rsj) {
            if (!rsj || rsj.kind != "Pack") {
                var msg = "Bad Request";
                if (rsj.error !== undefined) {
                    msg = rsj.error.message;
                }
                valueui.alert.InnerShow(alertid, "alert-danger", msg);
                return;
            }

            valueui.alert.InnerShow(alertid, "alert-success", "Successful operation");

            window.setTimeout(function () {
                valueui.modal.Close();
                inpack.PackListRefresh();
            }, 1000);
        },
        error: function (xhr, textStatus, error) {
            valueui.alert.InnerShow(alertid, "alert-danger", textStatus + " " + xhr.responseText);
        },
    });
};

inpack.ChannelListRefresh = function () {
    $("#ipscp-navbar-back").css({
        display: "none",
    });
    var alertid = "#ips-channells-alert";

    var ep = valueui.NewEventProxy("tpl", "data", function (tpl, rsj) {
        $("#work-content").html(tpl);

        if (!rsj) {
            rsj = {};
        }

        if (!rsj.kind || rsj.kind != "PackChannelList" || !rsj.items) {
            rsj.items = [];
        }

        if (rsj.items.length < 1) {
            if (inpack.Status.user_channel_write === true) {
                return inpack.ChannelSet();
            }
            return valueui.alert.InnerShow(
                alertid,
                "alert-danger",
                "No available, or authorized channels can be accessed"
            );
        }

        if (inpack.UserSession && inpack.UserSession.username == "sysadmin") {
            rsj._stat_size_on = true;
        }

        for (var i in rsj.items) {
            if (!rsj.items[i].stat_num) {
                rsj.items[i].stat_num = 0;
            }
            if (!rsj.items[i].stat_size) {
                rsj.items[i].stat_size = 0;
            }
            if (!rsj.items[i].roles) {
                rsj.items[i].roles = {
                    read: [],
                    write: [],
                };
            }
        }

        inCp.OpToolsRefresh("#ips-channells-optools");

        valueui.template.Render({
            dstid: "ips-channells",
            tplid: "ips-channells-tpl",
            data: rsj,
        });
    });

    ep.fail(function (err) {
        // TODO
        alert("ChannelSet error, Please try again later (EC:ips-channelset)");
    });

    valueui.utilx.Ajax(inpack.tplpath("channel/list"), {
        callback: ep.done("tpl"),
    });

    valueui.utilx.Ajax(inpack.apipath("channel/list"), {
        callback: ep.done("data"),
    });
};

inpack.ChannelDelete = function (name) {
    valueui.utilx.Ajax(inpack.apipath("channel/delete?name=" + name), {
        callback: function (err, rsj) {
            if (!rsj || rsj.kind != "PackChannel") {
                var msg = "Bad Request";
                if (rsj.error) {
                    msg = rsj.error.message;
                }
                return valueui.alert.InnerShow("#p4e5v1", "alert-danger", msg);
            }

            valueui.alert.InnerShow("#p4e5v1", "alert-success", "Successful operation");

            window.setTimeout(function () {
                inpack.cc_channels = null;
                inpack.ChannelListRefresh();
            }, 1000);
        },
        error: function (xhr, textStatus, error) {
            valueui.alert.InnerShow("#p4e5v1", "alert-danger", textStatus + " " + xhr.responseText);
        },
    });
};

inpack.ChannelSet = function (name) {
    var ep = valueui.NewEventProxy("tpl", "data", "roles", function (tpl, rsj, roles) {
        if (!rsj || rsj.error || !rsj.kind || rsj.kind != "PackChannel") {
            rsj = valueui.utilx.ObjectClone(inpack.channel_def);
        }

        if (!rsj.stat_num) {
            rsj.stat_num = 0;
        }
        if (!rsj.stat_size) {
            rsj.stat_size = 0;
        }
        if (!rsj.roles) {
            rsj.roles = {};
        }
        if (!rsj.roles.read) {
            rsj.roles.read = [];
        }
        if (!rsj.roles.write) {
            rsj.roles.write = [];
        }

        rsj._roles = valueui.utilx.ObjectClone(roles.items);
        for (var i in rsj._roles) {
            for (var j in rsj.roles.read) {
                if (rsj.roles.read[j] == rsj._roles[i].id) {
                    rsj._roles[i].read_checked = true;
                    break;
                }
            }
            for (var j in rsj.roles.write) {
                if (rsj.roles.write[j] == rsj._roles[i].id) {
                    rsj._roles[i].write_checked = true;
                    break;
                }
            }
        }

        $("#work-content").html(tpl);

        valueui.template.Render({
            dstid: "ips-channelset",
            tplid: "ips-channelset-tpl",
            data: {
                actionTitle: rsj.meta.name == "" ? "New Package Channel" : "Setting Channel",
                channel: rsj,
            },
        });
    });

    ep.fail(function (err) {
        // TODO
        alert("ChannelSet error, Please try again later (EC:ips-channelset)");
    });

    valueui.utilx.Ajax(inpack.tplpath("channel/set"), {
        callback: ep.done("tpl"),
    });

    if (inpack.iamAppRoles) {
        ep.emit("roles", inpack.iamAppRoles);
    } else {
        valueui.utilx.Ajax(inCp.base + "auth/app-role-list", {
            callback: function (err, data) {
                if (err) {
                    return alert(err);
                }
                if (!data.items || data.items.length < 1) {
                    return alert("No Roles Data Found");
                }
                inpack.iamAppRoles = data;
                ep.emit("roles", data);
            },
        });
    }

    if (!name) {
        ep.emit("data", "");
    } else {
        valueui.utilx.Ajax(inpack.apipath("channel/entry?name=" + name), {
            callback: ep.done("data"),
        });
    }
};

inpack.ChannelSetCommit = function () {
    var form = $("#ips-channelset");
    if (!form) {
        return;
    }

    var req = {
        meta: {
            name: form.find("input[name=name]").val(),
        },
        vendor_site: form.find("input[name=vendor_site]").val(),
        vendor_name: form.find("input[name=vendor_name]").val(),
        vendor_api: form.find("input[name=vendor_api]").val(),
        roles: {
            read: [],
            write: [],
        },
    };

    var alertid = "#ips-channelset-alert";
    try {
        form.find("input[name=roles_read]:checked").each(function () {
            var val = parseInt($(this).val());
            if (val > 1) {
                req.roles.read.push(val);
            }
        });

        form.find("input[name=roles_write]:checked").each(function () {
            var val = parseInt($(this).val());
            if (val > 1) {
                req.roles.write.push(val);
            }
        });
    } catch (err) {
        return valueui.alert.InnerShow(alert_id, "alert-danger", err);
    }

    valueui.utilx.Ajax(inpack.apipath("channel/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function (err, rsj) {
            if (!rsj || rsj.kind != "PackChannel") {
                var msg = "Bad Request";
                if (rsj.error) {
                    msg = rsj.error.message;
                }
                return valueui.alert.InnerShow(alertid, "alert-danger", msg);
            }

            valueui.alert.InnerShow(alertid, "alert-success", "Successful operation");

            window.setTimeout(function () {
                inpack.cc_channels = null;
                inpack.ChannelListRefresh();
            }, 1000);
        },
    });
};

inpack.channelImportArray = [];

inpack.ChannelImport = function () {
    inpack.channelImportArray = [];
    inpack.tplWorkLoader("channel/import");
};

inpack.ChannelImportConfirm = function () {
    var api = $("#ips-channel-import-api").val();
    $("#ips-channel-import-btn").attr("disabled", "disabled");

    valueui.alert.InnerShow("#p4e5v1", "alert-info", "Pending");

    valueui.utilx.Ajax(inpack.apipath("channel/list"), {
        callback: function (err, rsj) {
            if (!rsj || rsj.kind != "PackChannelList") {
                return valueui.alert.InnerShow(
                    "#p4e5v1",
                    "alert-danger",
                    "No Package Service Detected from this API"
                );
            }

            for (var i in rsj.items) {
                rsj.items[i].meta.updated = valueui.lang.TimeParseFormat(
                    rsj.items[i].meta.updated,
                    "Y-m-d"
                );
                if (!rsj.items[i].stat_num) {
                    rsj.items[i].stat_num = 0;
                }
                if (!rsj.items[i].stat_size) {
                    rsj.items[i].stat_size = 0;
                }
            }

            inpack.channelImportArray = rsj.items;

            valueui.template.Render({
                dstid: "ips-channel-import",
                tplid: "ips-channel-import-tpl",
                data: {
                    channels: rsj.items,
                },
                success: function () {
                    var div = $("#ips-channel-import-btn");
                    if (div) {
                        div.text("Confirm and Save");
                        div.attr("onclick", "inpack.ChannelImportSave()");
                        div.removeAttr("disabled");
                    }
                },
            });
        },
        error: function () {
            // TODO
            valueui.alert.InnerShow(
                "#p4e5v1",
                "alert-danger",
                "No Package Service Detected from this API"
            );
        },
    });
};

inpack.ChannelImportSave = function () {
    var chs = [];
    $("#ips-channel-import")
        .find("input[name='ips-channel-import-ids']:checked")
        .each(function () {
            chs.push($(this).val());
        });

    for (var i in inpack.channelImportArray) {
        var channel = inpack.channelImportArray[i];

        if (chs.indexOf(channel.meta.name) < 0) {
            continue;
        }

        channel.kind = "PackChannel";
        var alertid = "#ips-channel-import-id-" + channel.meta.name;

        valueui.utilx.Ajax(inpack.apipath("channel/set"), {
            method: "POST",
            data: JSON.stringify(channel),
            async: false,
            callback: function (err, rsj) {
                if (!rsj) {
                    return $(alertid).text("Failed");
                }

                if (rsj.kind != channel.kind) {
                    var msg = "Bad Request";
                    if (rsj.error !== undefined) {
                        msg = rsj.error.message;
                    }

                    return $(alertid).text(msg);
                }

                $(alertid).text("OK");
            },
            error: function (xhr, textStatus, error) {
                $(alertid).text(textStatus + " " + xhr.responseText);
                // valueui.alert.InnerShow("#d8e0m0", 'alert-danger', textStatus+' '+xhr.responseText);
            },
        });
    }
};

inpack.UtilResourceSizeFormat = function (size, tofix) {
    var ms = [
        [7, "ZB"],
        [6, "EB"],
        [5, "PB"],
        [4, "TB"],
        [3, "GB"],
        [2, "MB"],
        [1, "KB"],
    ];

    if (!tofix || tofix < 0) {
        tofix = 0;
    }

    for (var i in ms) {
        if (size >= Math.pow(1024, ms[i][0])) {
            return (size / Math.pow(1024, ms[i][0])).toFixed(tofix) + " " + ms[i][1];
        }
    }

    if (size == 0) {
        return size;
    }

    return size + " B";
};
