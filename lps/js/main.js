var lpLps = {
    base: "/lps/",
    api: "/lps/v1/",
    nav_reged: false,
    channel_def: {
        kind: "PackageChannel",
        meta: {
            name: "",
        },
        vendor_name: "",
        vendor_api: "http://example.com/lps/v1",
        vendor_site: "http://example.com",
    },
    cc_channels: null,
    cc_groups: null,
    infols_qry_grpactive: "",
    infols_qry_grpvalue: "Groups",
    pkgls_qry_pkgactive: null,
    pkgls_qry_chanactive: "",
    pkgls_qry_chanvalue: "Channels",
    option_dstid: "comp-content",
    option_navpf: "lospack",
}

lpLps.path = function(uri) {
    return lpLps.base + uri;
}

lpLps.apipath = function(uri) {
    return lpLps.api + uri;
}

lpLps.tplpath = function(uri) {
    return lpLps.base + "tpl/" + uri + ".html";
}

lpLps.tplWorkLoader = function(uri) {
    l4i.Ajax(lpLps.tplpath(uri), {
        callback: function(err, data) {
            if (err) {
                return;
            }

            $("#work-content").html(data);
        },
    })
}

lpLps.Index = function(options) {

    var divstr = "<div id='" + lpLps.option_navpf + "-module-navbar'>\
  <ul id='lpscp-navbar' class='" + lpLps.option_navpf + "-module-nav'>\
    <li><a class='l4i-nav-item' href='#lps/pkginfo'>Packages</a></li>\
    <li><a class='l4i-nav-item' href='#lps/channel'>Channels</a></li>\
  </ul>\
  <ul id='" + lpLps.option_navpf + "-module-navbar-optools' class='" + lpLps.option_navpf + "-module-nav " + lpLps.option_navpf + "-nav-right'></ul>\
</div>\
<div id='work-content'></div>";

    $("#" + lpLps.option_dstid).html(divstr);

    if (!lpLps.nav_reged) {
        l4i.UrlEventRegister("lps/pkginfo", lpLps.InfoListRefresh, "lpscp-navbar");
        // l4i.UrlEventRegister("lps/pkg", lpLps.PackageList, "lpscp-navbar");
        l4i.UrlEventRegister("lps/channel", lpLps.ChannelListRefresh, "lpscp-navbar");
        lpLps.nav_reged = true;
    }

    if (options && options.dstid) {
        lpLps.option_dstid = options.dstid;
    }

    l4i.UrlEventHandler("lps/pkginfo", true);
}


lpLps.InfoListRefresh = function(tplid) {
    if (!tplid || tplid.indexOf("/") >= 0) {
        tplid = "lps-infols";
    }
    var alert_id = "#lps-infols-alert",
        uri = "";

    if (document.getElementById(tplid)) {

        uri += "?qry_text=" + $("#" + tplid + "-qry-text").val();

        if (lpLps.infols_qry_grpactive && lpLps.infols_qry_grpactive != "") {
            uri += "&qry_grpname=" + lpLps.infols_qry_grpactive;
        }
    }

    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create("tpl", "channels", "groups", "info",
            function(tpl, channels, groups, info) {

                if (tpl) {
                    $("#work-content").html(tpl);
                }
                losCp.OpToolsRefresh("#lps-infols-optools");

                if (channels.error) {
                    return l4i.InnerAlert(alert_id, 'alert-danger', channels.error.message);
                }

                if (!channels.items || channels.items.length < 1) {
                    return $("#lps-channel-set-alert").css({
                        "display": "block"
                    });
                }

                if (!groups.items || groups.items.length < 1) {
                    return $("#" + tplid + "-empty-alert").css({
                        "display": "block"
                    });
                }

                if (info.kind != "PackageInfoList" || !info.items) {
                    info.items = [];
                }

                if (info.items.length > 0) {
                    $("#" + tplid + "-empty-alert").css({
                        "display": "none"
                    });
                } else {
                    $("#" + tplid + "-empty-alert").css({
                        "display": "block"
                    });
                }
				for (var i in info.items) {
					info.items[i]._ico_
				}

                // refresh info list
                l4iTemplate.Render({
                    dstid: tplid,
                    tplid: tplid + "-tpl",
                    data: {
						_api_url: lpLps.api, 
                        items: info.items,
                        groups: groups.items,
                    },
                });

                // if (tpl) {
                l4iTemplate.Render({
                    dstid: tplid + "-grpnav",
                    tplid: tplid + "-grpnav-tpl",
                    data: {
                        groups: groups.items,
                        qry_grpname: lpLps.infols_qry_grpactive,
                        qry_grpvalue: lpLps.infols_qry_grpvalue,
                    },
                });
                // }

                if (!lpLps.cc_channels) {
                    lpLps.cc_channels = channels;
                }
                if (!lpLps.cc_groups) {
                    lpLps.cc_groups = groups;
                }
            });

        ep.fail(function(err) {
            alert("Network Abort, Please try again later");
        });

        if (document.getElementById(tplid)) {
            ep.emit("tpl", null);
        } else {
            l4i.Ajax(lpLps.tplpath("pkginfo/list"), {
                callback: ep.done("tpl"),
            });
        }

        if (lpLps.cc_channels && lpLps.cc_channels.items.length > 0) {
            ep.emit("channels", lpLps.cc_channels);
        } else {
            l4i.Ajax(lpLps.apipath("channel/list"), {
                callback: ep.done("channels"),
            });
        }

        if (lpLps.cc_groups && lpLps.cc_groups.items.length > 0) {
            ep.emit("groups", lpLps.cc_groups);
        } else {
            l4i.Ajax(lpLps.apipath("group/list"), {
                callback: ep.done("groups"),
            });
        }

        l4i.Ajax(lpLps.apipath("pkg-info/list" + uri), {
            callback: ep.done("info"),
        });
    });
}

lpLps.InfoSet = function(name) {
    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create("tpl", "data", function(tpl, data) {

            if (!data || data.kind != "PackageInfo") {
                return;
            }

            // $("#work-content").html(tpl);
            if (!data.description) {
                data.description = "";
            }

            l4iModal.Open({
                title: "Package Info Settings",
                width: 600,
                height: 400,
                tplsrc: tpl,
                success: function() {

                    l4iTemplate.Render({
                        dstid: "lps-infoset",
                        tplid: "lps-infoset-tpl",
                        data: {
                            info: data,
                        },
                    });
                },
                buttons: [
                    {
                        onclick: "l4iModal.Close()",
                        title: "Close",
                    },
                    {
                        onclick: "lpLps.InfoSetCommit()",
                        title: "Save",
                        style: "btn-primary",
                    },
                ],
            });
        });

        ep.fail(function(err) {
            alert("Network Abort, Please try again later");
        });

        l4i.Ajax(lpLps.apipath("pkg-info/entry?name=" + name), {
            callback: ep.done("data"),
        });

        l4i.Ajax(lpLps.tplpath("pkginfo/set"), {
            callback: ep.done("tpl"),
        });
    });
}

lpLps.InfoSetCommit = function() {
    var form = $("#lps-infoset"),
        alertid = "#lps-infoset-alert";
    var req = {
        meta: {
            name: form.find("input[name=name]").val(),
        },
        description: form.find("textarea[name=description]").val(),
    }

    l4i.Ajax(lpLps.apipath("pkg-info/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function(err, rsj) {

            if (err) {
                return l4i.InnerAlert(alertid, 'alert-danger', err);
            }

            if (!rsj || rsj.kind != "PackageInfo") {

                var msg = "Bad Request";
                if (rsj.error) {
                    msg = rsj.error.message;
                }

                return l4i.InnerAlert(alertid, 'alert-danger', msg);
            }

            l4i.InnerAlert(alertid, 'alert-success', "Successful operation");

            window.setTimeout(function() {
                l4iModal.Close();
                lpLps.InfoListRefresh();
            }, 1000);
        },
    });
}

lpLps.PackageNew = function() {
    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create("tpl", "channels", function(tpl, channels) {

            if (!channels.items || channels.items.length < 1) {
                alert("Please setup at least one Channel");
                return lpLps.ChannelSet();
            }

            $("#work-content").html(tpl);

            l4iTemplate.Render({
                dstid: "lps-pkgnew",
                tplid: "lps-pkgnew-tpl",
                data: {
                    channels: channels.items,
                },
            });
        });

        ep.fail(function(err) {
            alert("Network Abort, Please try again later");
        });

        if (lpLps.cc_channels) {
            ep.emit("channels", lpLps.cc_channels);
        } else {
            l4i.Ajax(lpLps.apipath("channel/list"), {
                callback: ep.done("channels"),
            });
        }

        l4i.Ajax(lpLps.tplpath("pkg/new"), {
            callback: ep.done("tpl"),
        });
    });
}

lpLps.PackageNewCommit = function() {
    var files = document.getElementById('lps-pkgnew-file').files,
        alertid = "#lps-pkgnew-alert";

    if (!files.length) {
        l4i.InnerAlert(alertid, "alert-danger", 'Please select a file');
        return;
    }

    for (var i = 0, file; file = files[i]; i++) {

        if (file.size > 100 * 1024 * 1024) {
            l4i.InnerAlert(alertid, "alert-danger", 'The file is too large to upload');
            return;
        }

        var reader = new FileReader();

        reader.onload = (function(file) {

            return function(e) {

                if (e.target.readyState != FileReader.DONE) {
                    return;
                }

                var req = {
                    kind: "PackageCommit",
                    size: file.size,
                    name: file.name,
                    data: e.target.result,
                    sumcheck: "sha1:TODO",
                    channel: $("#lps-pkgnew").find("select[name=channel]").val(),
                }
                // console.log(e.target.result);

                l4i.Ajax(lpLps.apipath("pkg/commit"), {
                    method: "POST",
                    data: JSON.stringify(req),
                    timeout: 600000,
                    callback: function(err, rsj) {


                        if (err || !rsj) {
                            if (err) {
                                return l4i.InnerAlert(alertid, 'alert-danger', err);
                            }
                            if (rsj && rsj.error) {
                                return l4i.InnerAlert(alertid, 'alert-danger', rsj.error.message);
                            }
                            return l4i.InnerAlert(alertid, 'alert-danger', "Can not connect service");
                        }

                        if (rsj.error) {
                            l4i.InnerAlert(alertid, 'alert-danger', rsj.error.message);
                            return;
                        }

                        if (rsj.kind != "PackageCommit") {
                            l4i.InnerAlert(alertid, 'alert-danger', "unknown error");
                            return;
                        }

                        l4i.InnerAlert(alertid, 'alert-success', "Successfully commit");

                        window.setTimeout(function() {
                            lpLps.tplWorkLoader("pkginfo/list");
                        }, 1000);
                    }
                });
            };

        })(file);

        reader.readAsDataURL(file);
    }
}

lpLps.PackageList = function() {
    lpLps.pkgls_qry_pkgactive = null;
    lpLps.pkgls_qry_chanactive = "";
    lpLps.pkgls_qry_chanvalue = "Channels";
    lpLps.PackageListRefresh();
}

lpLps.PackageListRefresh = function(tplid, pkgname) {
    if (pkgname) {
        lpLps.pkgls_qry_pkgactive = pkgname;
    }

    if (!tplid || tplid.indexOf("/") >= 0) {
        tplid = "lps-pkgls";
    }
    var alert_id = "#lps-pkgls-alert",
        uri = "?";
    if (lpLps.pkgls_qry_pkgactive) {
        uri += "qry_pkgname=" + lpLps.pkgls_qry_pkgactive;
    }

    if (document.getElementById(tplid)) {

        uri += "&qry_text=" + $("#" + tplid + "-qry-text").val();

        if (lpLps.pkgls_qry_chanactive && lpLps.pkgls_qry_chanactive != "") {
            uri += "&qry_chanid=" + lpLps.pkgls_qry_chanactive;
        }
    }

    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create("tpl", "channels", "pkgls",
            function(tpl, channels, pkgls) {

                if (tpl) {
                    $("#work-content").html(tpl);
                }

                if (!pkgls || !pkgls.kind || pkgls.kind != "PackageList" || !pkgls.items) {
                    pkgls.items = [];
                }

                if (pkgls.items.length > 0) {
                    $("#" + tplid + "-empty-alert").css({
                        "display": "none"
                    });
                } else {
                    $("#" + tplid + "-empty-alert").css({
                        "display": "block"
                    });
                }

                if (lpLps.pkgls_qry_pkgactive) {
                    $("#lps-pkgls-ui-hname").css({
                        "display": "none"
                    });
                }

                l4iTemplate.Render({
                    dstid: tplid,
                    tplid: tplid + "-tpl",
                    data: {
                        _pkgactive: lpLps.pkgls_qry_pkgactive,
                        items: pkgls.items,
                        channels: channels.items,
                    },
                });

                if (tpl) {
                    l4iTemplate.Render({
                        dstid: tplid + "-chans",
                        tplid: tplid + "-chans-tpl",
                        data: {
                            channels: channels.items,
                            qry_chanid: lpLps.pkgls_qry_chanactive,
                            qry_chanvalue: lpLps.pkgls_qry_chanvalue,
                        },
                    });
                }
                if (!lpLps.cc_channels) {
                    lpLps.cc_channels = channels;
                }
            });

        ep.fail(function(err) {
            alert("Network Abort, Please try again later");
        });

        if (document.getElementById(tplid)) {
            ep.emit("tpl", null);
        } else {
            l4i.Ajax(lpLps.tplpath("pkg/list"), {
                callback: ep.done("tpl"),
            });
        }

        if (lpLps.cc_channels && lpLps.cc_channels.items.length > 0) {
            ep.emit("channels", lpLps.cc_channels);
        } else {
            l4i.Ajax(lpLps.apipath("channel/list"), {
                callback: ep.done("channels"),
            });
        }

        l4i.Ajax(lpLps.apipath("pkg/list" + uri), {
            callback: ep.done("pkgls"),
        });
    });
}

lpLps.PackageSet = function(id) {
    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create("tpl", "channels", "pkg", function(tpl, channels, pkg) {

            if (!pkg || pkg.kind != "Package"
                || !channels || channels.kind != "PackageChannelList") {
                return;
            }

            l4iModal.Open({
                title: "Package Settings",
                width: 600,
                height: 400,
                tplsrc: tpl,
                success: function() {

                    l4iTemplate.Render({
                        dstid: "lps-pkgset",
                        tplid: "lps-pkgset-tpl",
                        data: {
                            channels: channels,
                            pkg: pkg,
                        },
                    });
                },
                buttons: [
                    {
                        onclick: "l4iModal.Close()",
                        title: "Close",
                    },
                    {
                        onclick: "lpLps.PackageSetCommit()",
                        title: "Save",
                        style: "btn-primary",
                    },
                ],
            });

            if (!lpLps.cc_channels) {
                lpLos.cc_channels = channels;
            }
        });


        ep.fail(function(err) {
            alert("Network Abort, Please try again later");
        });

        if (lpLps.cc_channels && lpLps.cc_channels.items.length > 0) {
            ep.emit("channels", lpLps.cc_channels);
        } else {
            l4i.Ajax(lpLps.apipath("channel/list"), {
                callback: ep.done("channels"),
            });
        }

        l4i.Ajax(lpLps.apipath("pkg/entry?id=" + id), {
            callback: ep.done("pkg"),
        });

        l4i.Ajax(lpLps.tplpath("pkg/set"), {
            callback: ep.done("tpl"),
        });
    });
}

lpLps.PackageSetCommit = function() {
    var alertid = "#lps-pkgset-alert",
        form = $("#lps-pkgset");
    if (!form) {
        return;
    }

    var req = {
        meta: {
            id: form.find("input[name=id]").val(),
        },
        channel: form.find("select[name=channel]").val(),
    }


    l4i.Ajax(lpLps.apipath("pkg/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function(err, rsj) {

            if (!rsj || rsj.kind != "Package") {
                var msg = "Bad Request";
                if (rsj.error !== undefined) {
                    msg = rsj.error.message;
                }
                l4i.InnerAlert(alertid, 'alert-danger', msg);
                return;
            }

            l4i.InnerAlert(alertid, 'alert-success', "Successful operation");

            window.setTimeout(function() {
                l4iModal.Close();
                lpLps.PackageListRefresh();
            }, 1000);
        },
        error: function(xhr, textStatus, error) {
            l4i.InnerAlert(alertid, 'alert-danger', textStatus + ' ' + xhr.responseText);
        }
    });
}


lpLps.ChannelListRefresh = function() {
    seajs.use(["ep"], function(EventProxy) {
        var ep = EventProxy.create('tpl', 'data', function(tpl, rsj) {

            if (!rsj) {
                rsj = {};
            }

            if (!rsj.kind || rsj.kind != "PackageChannelList" || !rsj.items) {
                rsj.items = [];
            }

            if (rsj.items.length < 1) {
                lpLps.ChannelSet();
                return;
            }

            for (var i in rsj.items) {
                if (!rsj.items[i].packages) {
                    rsj.items[i].packages = 0;
                }
            }

            $("#work-content").html(tpl);
            losCp.OpToolsRefresh("#lps-channells-optools");

            l4iTemplate.Render({
                dstid: "lps-channells",
                tplid: "lps-channells-tpl",
                data: {
                    channels: rsj.items,
                },
            });
        });

        ep.fail(function(err) {
            // TODO
            alert("ChannelSet error, Please try again later (EC:lps-channelset)");
        });

        l4i.Ajax(lpLps.tplpath("channel/list"), {
            callback: ep.done('tpl'),
        });

        l4i.Ajax(lpLps.apipath("channel/list"), {
            callback: ep.done('data'),
        });
    });
}

lpLps.ChannelDelete = function(id) {
    l4i.Ajax(lpLps.apipath("channel/delete?id=" + id), {
        callback: function(err, rsj) {

            if (!rsj || rsj.kind != "PackageChannel") {
                var msg = "Bad Request";
                if (rsj.error !== undefined) {
                    msg = rsj.error.message;
                }
                return l4i.InnerAlert("#p4e5v1", 'alert-danger', msg);
            }

            l4i.InnerAlert("#p4e5v1", 'alert-success', "Successful operation");

            window.setTimeout(function() {
                lpLps.cc_channels = null;
                lpLps.ChannelListRefresh();
            }, 1000);
        },
        error: function(xhr, textStatus, error) {
            l4i.InnerAlert("#p4e5v1", 'alert-danger', textStatus + ' ' + xhr.responseText);
        }
    });
}

lpLps.ChannelSet = function(id) {
    seajs.use(["ep"], function(EventProxy) {

        var ep = EventProxy.create('tpl', 'data', function(tpl, rsj) {

            if (!rsj || rsj.error || !rsj.kind || rsj.kind != "PackageChannel") {
                rsj = l4i.Clone(lpLps.channel_def);
            }

            if (!rsj.pkgNum) {
                rsj.pkgNum = 0;
            }

            $("#work-content").html(tpl);

            l4iTemplate.Render({
                dstid: "lps-channelset",
                tplid: "lps-channelset-tpl",
                data: {
                    actionTitle: ((rsj.meta.id == "") ? "New Package Channel" : "Setting Channel"),
                    channel: rsj,
                },
            });
        });

        ep.fail(function(err) {
            // TODO
            alert("ChannelSet error, Please try again later (EC:lps-channelset)");
        });

        l4i.Ajax(lpLps.tplpath("channel/set"), {
            callback: ep.done('tpl'),
        });

        if (!id) {
            ep.emit('data', "");
        } else {
            l4i.Ajax(lpLps.apipath("channel/entry?id=" + id), {
                callback: ep.done('data'),
            });
        }
    });
}



lpLps.ChannelSetCommit = function() {
    var form = $("#lps-channelset");
    if (!form) {
        return;
    }

    var req = {
        kind: "Channel",
        meta: {
            id: form.find("input[name=id]").val(),
            name: form.find("input[name=name]").val(),
        },
        vendor_site: form.find("input[name=vendor_site]").val(),
        vendor_name: form.find("input[name=vendor_name]").val(),
        vendor_api: form.find("input[name=vendor_api]").val(),
    }

    var alertid = "#lps-channelset-alert";

    l4i.Ajax(lpLps.apipath("channel/set"), {
        method: "POST",
        data: JSON.stringify(req),
        callback: function(err, rsj) {

            if (!rsj || rsj.kind != "PackageChannel") {
                var msg = "Bad Request";
                if (rsj.error) {
                    msg = rsj.error.message;
                }
                return l4i.InnerAlert(alertid, 'alert-danger', msg);
            }

            l4i.InnerAlert(alertid, 'alert-success', "Successful operation");

            window.setTimeout(function() {
                lpLps.cc_channels = null;
                lpLps.ChannelListRefresh();
            }, 2000);
        },
    });
}

lpLps.channelImportArray = [];

lpLps.ChannelImport = function() {
    lpLps.channelImportArray = [];
    lpLps.tplWorkLoader("channel/import");
}

lpLps.ChannelImportConfirm = function() {
    var api = $("#lps-channel-import-api").val();
    $("#lps-channel-import-btn").attr('disabled', 'disabled');

    l4i.InnerAlert("#p4e5v1", 'alert-info', "Pending");

    l4i.Ajax(lpLps.apipath("channel/list"), {
        callback: function(err, rsj) {

            if (!rsj || rsj.kind != "PackageChannelList") {
                return l4i.InnerAlert("#p4e5v1", 'alert-danger', "No Package Service Detected from this API");
            }

            for (var i in rsj.items) {
                rsj.items[i].meta.updated = l4i.TimeParseFormat(rsj.items[i].meta.updated, "Y-m-d");
                if (rsj.items[i].pkgNum === undefined) {
                    rsj.items[i].pkgNum = 0;
                }
            }

            lpLps.channelImportArray = rsj.items;

            l4iTemplate.Render({
                dstid: "lps-channel-import",
                tplid: "lps-channel-import-tpl",
                data: {
                    channels: rsj.items,
                },
                success: function() {
                    $("#lps-channel-import-btn").text("Confirm and Save");
                    $("#lps-channel-import-btn").attr("onclick", 'lpLps.ChannelImportSave()');
                    $("#lps-channel-import-btn").removeAttr("disabled");
                },
            });
        },
        error: function() {
            // TODO
            l4i.InnerAlert("#p4e5v1", 'alert-danger', "No Package Service Detected from this API");
        }
    });
}

lpLps.ChannelImportSave = function() {
    var chs = [];
    $("#lps-channel-import").find("input[name='lps-channel-import-ids']:checked").each(function() {
        chs.push($(this).val());
    });

    for (var i in lpLps.channelImportArray) {

        var channel = lpLps.channelImportArray[i];

        if (chs.indexOf(channel.meta.id) < 0) {
            continue;
        }

        channel.kind = "PackageChannel";
        var alertid = "#lps-channel-import-id-" + channel.meta.id;

        l4i.Ajax(lpLps.apipath("channel/set"), {
            method: "POST",
            data: JSON.stringify(channel),
            async: false,
            callback: function(err, rsj) {

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
            error: function(xhr, textStatus, error) {
                $(alertid).text(textStatus + ' ' + xhr.responseText);
            // l4i.InnerAlert("#d8e0m0", 'alert-danger', textStatus+' '+xhr.responseText);
            }
        });
    }
}


lpLps.UtilResourceSizeFormat = function(size, tofix) {
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
}

