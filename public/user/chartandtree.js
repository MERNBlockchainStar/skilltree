var data = undefined;

initData();

// get data from server
function initData(){
  var dataRequest = new XMLHttpRequest();
  dataRequest.open('GET', '/get/userdata', true);
  dataRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  dataRequest.setRequestHeader('x-access-token', localStorage.getItem("loginToken"));
  dataRequest.responseType = "json";
  dataRequest.onreadystatechange = function() {
      if(dataRequest.readyState == 4 && dataRequest.status == 200) {
          data = dataRequest.response;
          if (data.admin) document.getElementById('openAdminMenu').style.display = "block";
          checkFirstLogin();
          initUI(true, data);

          document.getElementById("home").onclick = function () {
              showTree(data.mainTree, data, true);
              initUI(true, data)
          };
      }
  }
  dataRequest.send();
}

// creates the pixi app
var app = new PIXI.Application({
        view: pixiCanvas,
        width: window.innerWidth,
        height: window.innerHeight - 60,
        //backgroundColor: 0x000000,
        transparent: true,
        antialias: true,
        autoStart: false,
        autoResize: true
});

// initializes the data of the card on the top-left corner of the page.
function initCard(){
  var treeCount = document.getElementById('treeCount');
  var skillCount = document.getElementById('skillCount');
  var pointCount = document.getElementById('pointCount');
  var cardUserName = document.getElementById('cardUserName');
  var cardMainTree = document.getElementById('cardMainTree');

  treeCount.innerHTML = data.trees.length + "<br>trees";
  skillCount.innerHTML = data.skills.length + "<br>skills";
  pointCount.innerHTML = data.skills.sum("achievedPoint") + "<br>points";
  cardUserName.innerHTML = data.username;
  cardMainTree.innerHTML = data.mainTree;
}

// initializes tge data of the card on the top-right corner of the page.
function initUI(self, _data){
  var card_username = document.getElementById('card_username');
  if (self) {
    card_username.innerHTML = "Welcome " + _data.username + "!";
  }
  else {
    card_username.innerHTML = "You're now viewing " + _data.username + "'s data.";
  }
  initCard();
  switchSearch("User");
}

// TOP BAR

// get username from token and show it
var tokenPayload = parseJwt(localStorage.getItem("loginToken"));

function checkFirstLogin() {
    if (data.mainTree != undefined) startLoader();
    else {
        var modal = document.getElementById('firstLogin');
        var btn = document.getElementById('savebtn');
        var mainTree = document.getElementById('maintree');

        btn.onclick = function() {
            var location = document.getElementById('location').value;
            var teachingDay = document.getElementById('day').value;
            var teachingTime = document.getElementById('timeStart').value + ' - ' + document.getElementById('timeEnd').value;


            var firstLoginData = {
                    mainTree: mainTree.value,
                    teachingDay: teachingDay,
                    teachingTime: teachingTime,
                    location: location
            };

            request('POST', '/set/firstlogindata', firstLoginData, function() {
                if(this.readyState == 4 && this.status == 200) {
                  window.open("/user/", "_self");
                }
            });
        }

        var span = document.getElementsByClassName("modalClose")[0];

        span.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        for (var i = 0; i < data.focusArea.treeNames.length; ++i) {
            var option = document.createElement('option');
            option.value = option.text = data.focusArea.treeNames[i];
            mainTree.add(option);
        }

        if (!data.willingToTeach) document.getElementById('teachingSettings').style.display = 'none';

        modal.style.display = "block";
    }
}

/*function toggleSkillDetailsPage() {
    var modal = document.getElementById('skillpage');

    modal.style.display = "block";

}*/

// loads the user's public and private trees.
function loadAddedTrees(){
  var treeList = document.getElementById('treeList');
  treeList.innerHTML = "";
  for (var i = 0; i < data.trees.length; i++) {
    var tn = data.trees[i].name;
    var ithtree = document.createElement('a');
    ithtree.innerHTML = tn;
    ithtree.className = "dropdown-item";
    ithtree.onclick = function() {
      showTree(this.innerHTML, data, true); // bator?
    }
    treeList.appendChild(ithtree);
  }
}

// searches users by the string provided.
function searchUsersByName(){
  var userToSearch = {value: document.getElementById('cardSearchBar').value};
  var UserSearchResult = document.getElementById('UserSearchResult');

  if (userToSearch !== "") {
    request('POST', '/set/searchUsersByName', userToSearch, function() {
        if(this.readyState == 4 && this.status == 200) {
          UserSearchResult.innerHTML = "";
          for (var i = 0; i < this.response.length; i++) {
            var mya = document.createElement('option');
            mya.value = this.response[i].name;
            UserSearchResult.appendChild(mya);
          }
        }
    });
  }
}

// searches skills by provided name
function searchSkillsByName(element){
    var skillToSearch = {value: element.value};
    var skillSearchResult = document.getElementById('skillSearchResult');
    request('POST', '/set/searchSkillsByName', skillToSearch, function () {
        if (this.readyState == 4 && this.status == 200) {
            skillSearchResult.innerText = "";
            for (var i = 0; i < this.response.length; i++) {
                var mya = document.createElement('option');
                mya.value = this.response[i].name;
                skillSearchResult.appendChild(mya);
            }
        }
    });
}

// searches skills by provided name
function searchUserSkillsByName(element){
    var skillToSearch = {value: element.value};
    var skillSearchResult = document.getElementById('skillSearchResult');
    request('POST', '/set/searchUserSkillsByName', skillToSearch, function () {
        if (this.readyState == 4 && this.status == 200) {
            skillSearchResult.innerText = "";
            for (var i = 0; i < this.response.length; i++) {
                var mya = document.createElement('option');
                mya.value = this.response[i].name;
                skillSearchResult.appendChild(mya);
            }
        }
    });
}

// searches trees by the provided name
function searchTreesByName (element, global) {
    var treeToSearch = {value: element.value};
    var TreeSearchResult = document.getElementById('TreeSearchResult');

    if (global) {
        request('POST', '/set/searchTreesByName', treeToSearch, function() {
            if(this.readyState == 4 && this.status == 200) {
                TreeSearchResult.innerHTML = "";
                for (var i = 0; i < this.response.length; ++i) {
                    var mya = document.createElement('option');
                    mya.value = this.response[i].name;
                    TreeSearchResult.appendChild(mya);
                }
            }
        });
    } else {
        TreeSearchResult.innerHTML = "";
        var res = data.trees.filter(obj => (new RegExp(".*" + treeToSearch + ".*", "i")).test(obj.name));
        for (var i = 0; i < res.length; ++i) {
            var mya = document.createElement('option');
            mya.value = res[i].name;
            TreeSearchResult.appendChild(mya);
        }
    }
}

// gets the username, trees, skills and maintree of the user.
function getPublicUserData(){
  var userToSearch = {value: document.getElementById('cardSearchBar').value};
  request('POST', '/set/getPublicUserData', userToSearch, function() {
      if(this.readyState == 4 && this.status == 200) {
        var modal = document.getElementById('searchModal');
        var searchModalBody = document.getElementById('searchModalBody');
        var searchModalHeader = document.getElementById('searchModalHeader');
        document.getElementById('closeSearchModal').onclick = function() {
          modal.style.display = "none";
        };
        searchModalHeader.innerHTML = '<th scope="col">#</th><th scope="col">Name</th><th scope="col">MainTree</th><th scope="col">Willing to help</th>';
        searchModalBody.innerHTML = "";
        for (var i = 0; i < this.response.length; i++) {
          var row = document.createElement('tr');
          row.className = "foundElementRow";
          row.innerHTML += "<th>" + (i+1) + "</th>";
          row.innerHTML += "<td>" + this.response[i].username + "</td>";
          row.innerHTML += "<td>" + this.response[i].mainTree + "</td>";
          row.innerHTML += "<td>" + this.response[i].willingToTeach + "</td>";
          row.data = this.response[i];
          row.onclick = function(){
            var searchedUserModal = document.getElementById('searchedUserModal');
            var closeSearchedUserModal = document.getElementById('closeSearchedUserModal');
            var searchedUserModalHeader = document.getElementById('searchedUserModalHeader');
            var searchedUserlModalInfo = document.getElementById('searchedUserlModalInfo');
            var searchedUserlModalAdress = document.getElementById('searchedUserlModalAdress');
            var userSkillsModalHeader = document.getElementById('userSkillsModalHeader');
            var userSkillsModalBody = document.getElementById('userSkillsModalBody');

            searchedUserModalHeader.innerHTML = this.data.username;
            searchedUserlModalInfo.innerHTML = this.data.username + "s focusarea is " + this.data.focusArea.name + ", and his/her main Tree is " + this.data.mainTree + ". ";
            searchedUserlModalAdress.innerHTML = "He/She is avalible at <br><b>Date</b>: " + this.data.teachingDay + this.data.teachingTime + "<br><b>Place</b>: <a href=" + this.data.location + ">" + this.data.location + "</a><br>";
            userSkillsModalHeader.innerHTML = '<th scope="col">#</th><th scope="col">Name</th><th scope="col">Level</th><th scope="col">Endorsement</th>';
            userSkillsModalBody.innerHTML = "";
            for (var i = 0; i < this.data.skills.length; i++) {
              var row = document.createElement('tr');
              row.className = "foundElementRow";
              row.innerHTML += "<th>" + (i+1) + "</th>";
              row.innerHTML += "<th>" + this.data.skills[i].name + "</th>";
              row.innerHTML += "<th>" + this.data.skills[i].achievedPoint + "</th>";
              row.innerHTML += "<th>" + this.data.skills[i].endorsement.length + "</th>";
              var sv = {skillName: this.data.skills[i].name, username: this.data.username};
              row.onclick = function(){
                request('POST', '/set/endorse', sv, function() {
                    if(this.readyState == 4 && this.status == 200) {
                      alert(this.response.message);
                    }
                });
              }
              userSkillsModalBody.appendChild(row);
            }
            closeSearchedUserModal.onclick = function(){
              searchedUserModal.style.display = "none";
            }
            searchedUserModal.style.display = "block";
          }
          searchModalBody.appendChild(row);
        }
        modal.style.display = "block";
      }
  });
}

// gets the name, skillnames, focusarea of a tree.
function getPublicTreeData(){
  var treeToSearch = {value: document.getElementById('cardSearchBar').value};
  request('POST', '/set/getPublicTreeData', treeToSearch, function() {
      if(this.readyState == 4 && this.status == 200) {
        var modal = document.getElementById('searchModal');
        var searchModalBody = document.getElementById('searchModalBody');
        var searchModalHeader = document.getElementById('searchModalHeader');
        document.getElementById('closeSearchModal').onclick = function() {
          modal.style.display = "none";
        };
        searchModalHeader.innerHTML = '<th scope="col">#</th><th scope="col">Name</th><th scope="col">Focus Area</th>';
        searchModalBody.innerHTML = "";
        for (var i = 0; i < this.response.length; i++) {
          var row = document.createElement('tr');
          row.className = "foundElementRow";
          row.innerHTML += "<th>" + (i+1) + "</th>";
          row.innerHTML += "<td>" + this.response[i].name + "</td>";
          row.innerHTML += "<td>" + this.response[i].focusArea + "</td>";
          row.treeName = this.response[i].name;
          row.onclick = function() {
            addTreeToUser({value: this.treeName});
          }
          searchModalBody.appendChild(row);
        }
        modal.style.display = "block";
      }
  });
}

// gets the name, caterory, desc, relations and training data of a skill.
function getPublicSkillData(){
  var skillToSearch = {value: document.getElementById('cardSearchBar').value};
  request('POST', '/set/getPublicSkillData', skillToSearch, function() {
      if(this.readyState == 4 && this.status == 200) {
        var modal = document.getElementById('searchModal');
        var searchModalBody = document.getElementById('searchModalBody');
        var searchModalHeader = document.getElementById('searchModalHeader');
        document.getElementById('closeSearchModal').onclick = function() {
          modal.style.display = "none";
        };
        searchModalHeader.innerHTML = '<th scope="col">#</th><th scope="col">Name</th><th scope="col">Category</th><th scope="col">Description</th>';
        searchModalBody.innerHTML = "";
        for (var i = 0; i < this.response.length; i++) {
          var row = document.createElement('tr');
          row.className = "foundElementRow";
          row.innerHTML += "<th>" + (i+1) + "</th>";
          row.innerHTML += "<td>" + this.response[i].name + "</td>";
          row.innerHTML += "<td>" + this.response[i].categoryName + "</td>";
          row.innerHTML += "<td>" + this.response[i].description + "</td>";
          row.data = {
            name: this.response[i].name,
            categoryName: this.response[i].categoryName,
            description: this.response[i].description,
            pointDescription: this.response[i].pointDescription,
            descriptionWikipediaURL: this.response[i].descriptionWikipediaURL
          }
          row.onclick = function(){
            var foundmodal = document.getElementById('searchedSkillModal');
            var header = document.getElementById('searchedSkillModalHeader');
            var category = document.getElementById('searchedSkillModalCategory');
            var pdesc = document.getElementById('searchedSkillModalPDesc');
            var desc = document.getElementById('searchedSkillModalDesc');
            var wiki = document.getElementById('searchedSkillModalWiki');
            var closer = document.getElementById('closeSearchedSkillModal');
            header.innerHTML = this.data.name;
            category.innerHTML = "<b>Category</b>: " + this.data.categoryName;
            pdesc.innerHTML = "<b>Description by points</b>: <br> 1: " + this.data.pointDescription[0] + "<br>" +
                                                          "2: " + this.data.pointDescription[1] + "<br>" +
                                                          "3: " + this.data.pointDescription[2] + "<br>" +
                                                          "4: " + this.data.pointDescription[3] + "<br>" +
                                                          "5: " + this.data.pointDescription[4];
            desc.innerHTML = "<b>Description</b>: " + this.data.description;
            wiki.innerHTML = "<b>Wiki link</b>: <a href=" + this.data.descriptionWikipediaURL + ">" + this.data.descriptionWikipediaURL + "</a>";
            foundmodal.style.display = "block";
            closer.onclick = function(){
              foundmodal.style.display = "none";
            }
          }
          searchModalBody.appendChild(row);
        }
        modal.style.display = "block";
      }
  });
}

// switches the advanced search card to the requested type
function switchSearch(type){
  document.getElementById('advSearchDetails').innerHTML = "";
  if (type === "Skill") {
    document.getElementById('cardSearchBar').onkeyup = function(){
      searchSkillsByName(this);
    };
    document.getElementById('cardSearchBar').setAttribute('list', "skillSearchResult");
    document.getElementById('cardSearch').onclick = getPublicSkillData;
    /*addCheckBox("1", "Skill Option 1", 'advSearchDetails');
    addCheckBox("2", "Skill Option 2", 'advSearchDetails');
    addCheckBox("3", "Skill Option 3", 'advSearchDetails');*/
  }
  else if (type === "Tree") {
    document.getElementById('cardSearchBar').onkeyup = searchTreesByName;
    document.getElementById('cardSearchBar').setAttribute('list', "TreeSearchResult");
    document.getElementById('cardSearch').onclick = getPublicTreeData;
    /*addCheckBox("1", "Tree Option 1", 'advSearchDetails');
    addCheckBox("2", "Tree Option 2", 'advSearchDetails');
    addCheckBox("3", "Tree Option 3", 'advSearchDetails');*/
  }
  else if (type === "User"){
    document.getElementById('cardSearchBar').onkeyup = searchUsersByName;
    document.getElementById('cardSearchBar').setAttribute('list', "UserSearchResult");
    document.getElementById('cardSearch').onclick = getPublicUserData;
    /*addCheckBox("1", "User Option 1", 'advSearchDetails');
    addCheckBox("2", "User Option 2", 'advSearchDetails');
    addCheckBox("3", "User Option 3", 'advSearchDetails');*/ // checkboxes disabled for now, for no good use.
  }
}

// adds a public tree to the user
function addTreeToUser(treeToAdd){
  request('POST', '/set/addTreeToUser', treeToAdd, function() {
      if (this.readyState == 4 && this.status == 200) {
        if (this.response.success){
          var forest = document.getElementById("treeList");
          var nt = document.createElement('div');
          nt.innerText = this.response.name;
          nt.className = "listedTree";
          forest.appendChild(nt);
          alert("Selected tree successfully added.");
          initData();
          loadAddedTrees();
        } else if (this.response.message == "existing") alert("Selected tree is already added.");
        else if (this.response.message == "notfound") alert("The tree is not found.");
      }
  });
}

// confirm the changes made to skill levels.
function submit(){
    var submitData = data.skills;
    for (var i = 0; i < submitData.length; ++i) {
        delete submitData[i].itemcontainer;
    }
    request('POST', '/set/submitall', submitData, function() {
        if(this.readyState == 4 && this.status == 200) {
          //initData();
          initUI(true, data); // not working opening another users tree
        }
    });
}

window.setInterval(function(){
    submit();
}, 5000);

// logout.
function logout(){
    localStorage.setItem("loginToken", "");
    window.open("/", "_self");
}

// loads the needed pics for the tree, then loads the tree.
function startLoader () {
    PIXI.loader.reset();

    PIXI.loader.add("pictures/skillborder.png")
                //.add("pictures/tree_bg/art-background-blank-951240.jpg")
                .add("pictures/tree.png")
                .add("pictures/tick.png");
    for (var i = 0; i < data.skills.length; ++i) {
        PIXI.loader.add(data.skills[i].skillIcon.toString());
    }
    PIXI.loader.load(function () {
        showTree(data.mainTree, data, true);
    });
    loadAddedTrees();
}

app.stage = new PIXI.display.Stage();
app.stage.group.enableSort = true;

// CHART

document.getElementById("openchart").onclick = showChart;

var chartContainer = new PIXI.Container();

// hides tree, shows chart.
function showChart() {
    document.getElementById('creator').style.display = "none";
    document.getElementById('approveTrees').style.display = "none";
    document.getElementById('approveSkills').style.display = "none";
    document.getElementById('pixiCanvas').style.display = "block";

    document.getElementById("openchart").onclick = showTree(data.mainTree, data, true);

    if (tree != undefined) {
        app.stage.removeChild(tree.treeContainer);
        tree = undefined;
    }

    chartContainer = new PIXI.Container();

    var sliceCount = data.categories.length;

    //initialize chart variables
    var x = 0;
    var y = 0;
    var width = 240;
    var h1 = 60;
    var h2 = h1 + width;

    for (var i = 0; i < sliceCount; i++) {
        var tempContainer = new PIXI.Container();

        var skills = data.skills.filter(obj => obj.categoryName == data.categories[i].name);
        var sumAP = skills.sum("achievedPoint");
        var sumMP = skills.sum("maxPoint");
        var percent = 0;
        if (sumMP != 0) percent = sumAP / sumMP;

        h2 = h1 + width;
        var s = (i * (360 / sliceCount) * Math.PI) / 180;
        var e = ((i + 1) * (360 / sliceCount) * Math.PI) / 180;

        var slice = new PIXI.Graphics();
        slice.lineStyle(3, 0x000000);

        slice.moveTo(x + Math.cos(e) * h1, y + Math.sin(e) * h1);
        slice.beginFill(0xFFFFFF);
        slice.arc(x, y, h1, e, s, true);
        slice.arc(x, y, h2, s, e, false);
        slice.lineTo(x + Math.cos(e) * h1, y + Math.sin(e) * h1);
        slice.endFill();

        tempContainer.addChild(slice);

        h2 = h1 + (width * percent);
        var innerSlice = new PIXI.Graphics();
        innerSlice.lineStyle(3, 0x000000);
        innerSlice.moveTo(x + Math.cos(e) * h1, y + Math.sin(e) * h1);
        innerSlice.beginFill(0x5cb85c);
        innerSlice.arc(x, y, h1, e, s, true);
        innerSlice.arc(x, y, h2, s, e, false);
        innerSlice.lineTo(x + Math.cos(e) * h1, y + Math.sin(e) * h1);
        innerSlice.endFill();

        tempContainer.addChild(innerSlice);


        //Clickabke slices ----------------------------
        /*sliceContainer[i].buttonMode = true;
        sliceContainer[i].interactive = true;

        sliceContainer[i]
                    .on('pointerover', function() {
                        this.alpha = 0.75;
                        app.renderer.render(app.stage);
                    })
                    .on('pointerout', function() {
                        this.alpha = 1;
                        app.renderer.render(app.stage);
                    })
                    .on('pointerdown', function() {
                        hideChart();
                        showTree(this.id);
                    });*/

        // creates tree name at the chart
        //var text = new PIXI.Text(treeData.find(obj => obj.treeID == userData[i].treeID).treeName, {fill: '#ffffff', wordWrap: true, wordWrapWidth: 200, align: 'center'});

        //Write category names
        var text = new PIXI.Text(data.categories[i].name, {fill: '#000000', wordWrap: true, wordWrapWidth: 200, align: 'center'});
        var points = [];
        var radius = 320 + (text.height / 29 - 1) * 15;
        var pointsCount = 20;
        if (Math.floor(sliceCount / 2) <= i) {
            for (var j = 0; j < pointsCount; j++) {
                var px = radius * Math.cos(j * Math.PI * 2 * text.width / (250 * 8 / sliceCount) / pointsCount / sliceCount + s);
                var py = radius * Math.sin(j * Math.PI * 2 * text.width / (250 * 8 / sliceCount) / pointsCount / sliceCount + s);
                points.push(new PIXI.Point(px, py));
            }
        } else {
            for (var j = pointsCount - 1; j > 0; --j) {
                var px = radius * Math.cos(j * Math.PI * 2 * text.width / (250 * 8 / sliceCount) / pointsCount / sliceCount + s);
                var py = radius * Math.sin(j * Math.PI * 2 * text.width / (250 * 8 / sliceCount) / pointsCount / sliceCount + s);
                points.push(new PIXI.Point(px, py));
            }
        }

        var rope = new PIXI.mesh.Rope(text.texture, points);
        rope.rotation = (Math.PI * 2 / sliceCount - text.width / (240 * 8 / sliceCount) * Math.PI * 2 / sliceCount * 0.95) / 2;
        tempContainer.addChild(rope);

        chartContainer.addChild(tempContainer);
    }

    /*var logo = new PIXI.Sprite(PIXI.loader.resources["tree.png"].texture);
    logo.anchor.set(0.5, 0.5);
    logo.position.set(window.innerWidth / 2, window.innerHeight / 2);
    logo.scale.set(0.42);
    app.stage.addChild(logo);
    chartContainer.addChild(logo);*/

    chartContainer.position.set((window.innerWidth) / 2, (window.innerHeight - 64) / 2);
    app.stage.addChild(chartContainer);

    // scale chart
    var ratio = chartContainer.width / chartContainer.height;
    if (window.innerWidth < window.innerHeight - 90) {
        chartContainer.width = window.innerWidth - 40;
        chartContainer.height = (window.innerWidth - 40) / ratio;
    } else {
        chartContainer.width = (window.innerHeight - 90) * ratio;
        chartContainer.height = window.innerHeight - 90;
    }

    //app.renderer.render(app.stage);
}

window.onresize = function () {
    app.renderer.resize(window.innerWidth, window.innerHeight - 60);

    if (chartContainer != undefined) {
        var ratio = chartContainer.width / chartContainer.height;
        if (window.innerWidth < window.innerHeight - 90) {
            chartContainer.width = window.innerWidth - 40;
            chartContainer.height = (window.innerWidth - 40) / ratio;
        } else {
            chartContainer.width = (window.innerHeight - 90) * ratio;
            chartContainer.height = window.innerHeight - 90;
        }

        chartContainer.position.set((window.innerWidth) / 2, (window.innerHeight - 64) / 2);
    }

    if (tree != undefined) {
        tree.treeContainer.position.set(app.renderer.width / 2 + tree.treeContainer.width / 2, app.renderer.height / 2);
    }

    app.renderer.render(app.stage);
};

// TREE

// app.localLoader is a loader for skillicons (when a tree is opened, we load only that tree's skillicons)
// PIXI.loader is global, it loads the back button, skillborder, tree,...

var selectedTreeName;
var tree = undefined;

// hides chart, shows tree
function showTree (treeName, _data, self) {
    document.getElementById('creator').style.display = "none";
    document.getElementById('approveTrees').style.display = "none";
    document.getElementById('approveSkills').style.display = "none";
    document.getElementById('pixiCanvas').style.display = "block";

    if (tree != undefined) {
        app.stage.removeChild(tree.treeContainer);
        tree = undefined;
    }
    selectedTreeName = treeName;

    var skills = new Array();
    for (var j = 0; j < _data.trees.find(obj => obj.name == treeName).skillNames.length; ++j) {
        var skillName = _data.trees.find(obj => obj.name == treeName).skillNames[j];
        var skill = _data.skills.find(obj => obj.name == skillName);

        skills.push(skill);
    }

    if (chartContainer != undefined) {
        app.stage.removeChild(chartContainer);
        chartContainer = undefined;
    }

    document.getElementById("openchart").value = "Open Chart";
    document.getElementById("openchart").onclick = showChart;

    var owner = {self: self, username: _data.username};
    tree = new Tree(app, skills, owner);
    app.stage.addChild(tree.treeContainer);
    tree.treeContainer.pivot.set(tree.treeContainer.width / 2, tree.treeContainer.height / 2);
    tree.treeContainer.position.set(app.renderer.width / 2 + tree.treeContainer.width / 2, app.renderer.height / 2);

    tree.treeContainer.alpha = 1;
    tree.skills[0].itemcontainer.refreshAvaliability();
    app.renderer.render(app.stage);
    document.getElementById("pixiCanvas").style.visibility = "visible";
    app.start();

    // fading animation, disabled for now.
    /*var fadein = function (delta) {
        tree.treeContainer.alpha += .05;
        if (tree.treeContainer.alpha == 1) {
            app.ticker.remove(fadein);
            app.stop();
        }
    };
    app.ticker.add(fadein);*/
}

function addTraining () {
    var modal = document.getElementById("addTrainingModal");
    modal.style.display = "block";

    var span = document.getElementById("closeTrainingModal");

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    var save = document.getElementById("saveTrainingsBtn");
    save.onclick = function () {
        var trainingsTable = document.getElementById('addTrainingsTable');
        var trainings = [];
        for (i = 1; i < trainingsTable.rows.length; ++i) {
            trainings.push({
                name: trainingsTable.rows[i].cells[0].children[0].value,
                level: trainingsTable.rows[i].cells[1].children[0].value,
                shortDescription: trainingsTable.rows[i].cells[2].children[0].value,
                URL: trainingsTable.rows[i].cells[3].children[0].value,
                goal: trainingsTable.rows[i].cells[4].children[0].value,
                length: trainingsTable.rows[i].cells[5].children[0].value,
                language: trainingsTable.rows[i].cells[6].children[0].value
            });
        }

        var trainingData = {
            skillName: document.getElementById('trainingSkillName').value,
            trainings: trainings,
            forApprove: true
        };

        request('POST', '/set/newtraining', trainingData, function () {
            if (this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                //reset table
                var trainingsTable = document.getElementById('addTrainingsTable');
                var i=trainingsTable.rows.length-1;
                while(i>1)
                {
                    trainingsTable.deleteRow(i);
                    i--;
                }
                trainingsTable.rows[1].cells[0].children[0].value = "";
                trainingsTable.rows[1].cells[1].children[0].value = "";
                trainingsTable.rows[1].cells[2].children[0].value = "";
                trainingsTable.rows[1].cells[3].children[0].value = "";
                trainingsTable.rows[1].cells[4].children[0].value = "";
                trainingsTable.rows[1].cells[5].children[0].value = "";
                trainingsTable.rows[1].cells[6].children[0].value = "";

                alert("Succes");

                } else if (this.response.message == "skillnotexists") {
                    alert("Skill not found");
                }
            }
        });
    };
}

// opens skill creation, and manages it.

// searches skills by provided name

function createSkill () {
    var modal = document.getElementById("newSkillModal");
    modal.style.display = "block";

    var span = document.getElementById("closeSkillModal");

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById("loadSkill").style.display = "none";

    var catSelect = document.getElementById("newSkillCat");
    catSelect.innerHTML = "";
    for (var i = 0; i < data.categories.length; ++i) {
        var option = document.createElement("option");
        option.text = data.categories[i].name;
        option.value = data.categories[i].name;
        catSelect.add(option);
    }

    var save = document.getElementById("saveSkillBtn");
    save.onclick = function () {
        var pointsTable = document.getElementById('pointsTable');
        var pointsNum = pointsTable.rows.length - 1;
        var pointDescription = [];
        for (i = 1; i < pointsNum + 1; ++i) pointDescription.push(pointsTable.rows[i].cells[1].children[0].value);

        var parentsTable = document.getElementById('parentsTable');
        var parents = [];
        for (i = 1; i < parentsTable.rows.length; ++i) {
            parents.push({
                name: parentsTable.rows[i].cells[0].children[0].value,
                minPoint: parentsTable.rows[i].cells[1].children[0].value,
                recommended: !parentsTable.rows[i].cells[2].children[0].checked
            });
        }

        /*var childrenTable = document.getElementById('childrenTable');
        var children = [];
        for (i = 1; i < childrenTable.rows.length; ++i) {
            children.push({
                name: childrenTable.rows[i].cells[0].children[0].value,
                minPoint: childrenTable.rows[i].cells[1].children[0].value,
                recommended: !childrenTable.rows[i].cells[2].children[0].checked
            });
        }*/

        var trainingsTable = document.getElementById('trainingsTable');
        var trainings = [];
        for (i = 1; i < trainingsTable.rows.length; ++i) {
            trainings.push({
                name: trainingsTable.rows[i].cells[0].children[0].value,
                level: trainingsTable.rows[i].cells[1].children[0].value,
                shortDescription: trainingsTable.rows[i].cells[2].children[0].value,
                URL: trainingsTable.rows[i].cells[3].children[0].value,
                goal: trainingsTable.rows[i].cells[4].children[0].value,
                length: trainingsTable.rows[i].cells[5].children[0].value,
                language: trainingsTable.rows[i].cells[6].children[0].value
            });
        }

        var skillData = {
            name: document.getElementById('newSkillName').value,
            description: document.getElementById('newSkillDesc').value,
            skillIcon: document.getElementById('newSkillIcon').value,
            categoryName: catSelect.value,
            maxPoint: pointsNum,
            pointDescription: pointDescription,
            parents: parents,
            //children: children,
            trainings: trainings,
            forApprove: true
        };

        request('POST', '/set/newskill', skillData, function () {
            if (this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                    modal.style.display = "none";
                }
            }
        });
    };
}

function editMySkill () {
    var modal = document.getElementById("newSkillModal");
    modal.style.display = "block";

    var span = document.getElementById("closeSkillModal");

    span.onclick = function() {
        modal.style.display = "none";
    }

    document.getElementById("loadSkill").style.display = "block";
    document.getElementById("newSkillModalTitle").innerText = "Edit your skill";

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.getElementById("newSkillModalTitle").innerText = "Create your own skill";
        }
    }

    var skillName = document.getElementById("newSkillName");
    skillName.setAttribute('list', 'skillSearchResult');
    skillName.onkeyup = function() {searchSkillsByName(this)};

    var loadSkill = document.getElementById("loadSkill");
    //TODO fill data with requested data
    loadSkill.onclick =function(){
        //request for the skill to load data from
        var skillname = document.getElementById('newSkillName').value;

        skillData = {
            name: skillname
        }

        request('POST', '/set/searchUserSkillByName', skillData , function () {
        if (this.readyState == 4 && this.status == 200) {
            if(this.response !== undefined)
            {
                document.getElementById('newSkillName').value = this.response.name;
                document.getElementById('newSkillDesc').value = this.response.description;
                document.getElementById('newSkillIcon').value = this.response.skillIcon;
                document.getElementById("newSkillCat").value = this.response.categoryName;



                //Dropping data from parentsTable
                var parentsTable = document.getElementById('parentsTable');
                var i=parentsTable.rows.length-1;
                while(i>1)
                {
                    parentsTable.deleteRow(i);
                    i--;
                }
                parentsTable.rows[1].cells[0].children[0].value = "";
                parentsTable.rows[1].cells[1].children[0].value = "";
                parentsTable.rows[1].cells[2].children[0].checked = false;

                //Dropping data from trainingsTable
                var trainingsTable = document.getElementById('trainingsTable');
                var i=trainingsTable.rows.length-1;
                while(i>1)
                {
                    trainingsTable.deleteRow(i);
                    i--;
                }
                trainingsTable.rows[1].cells[0].children[0].value = "";
                trainingsTable.rows[1].cells[1].children[0].value = "";
                trainingsTable.rows[1].cells[2].children[0].value = "";
                trainingsTable.rows[1].cells[3].children[0].value = "";
                trainingsTable.rows[1].cells[4].children[0].value = "";
                trainingsTable.rows[1].cells[5].children[0].value = "";
                trainingsTable.rows[1].cells[6].children[0].value = "";


                var parents = this.response.parents;
                var skillname = this.response.name;
                request('POST', '/set/parentTableData', {name: skillname, parents: [parents] } , function(){
                    if (this.readyState == 4 && this.status == 200) {
                        if(this.response !== undefined)
                        {
                            if(this.response!=null)
                            for(var i=0;i<this.response.length;i++)
                            {
                                addRow("parentsTable");

                                parentsTable.rows[i+1].cells[0].children[0].value = this.response[i].name;
                                parentsTable.rows[i+1].cells[1].children[0].value = this.response[i].minPoint;
                                parentsTable.rows[i+1].cells[2].children[0].checked = !this.response[i].recommended;

                            }

                        }
                    }
                });

                request('POST', '/set/trainingTableData', {skillname: skillname} , function(){
                    if (this.readyState == 4 && this.status == 200) {
                        if(this.response !== undefined)
                        {
                            if(this.response!=null)
                            for(var i=0;i<this.response.length;i++)
                            {
                                addRow("trainingsTable");

                                trainingsTable.rows[i+1].cells[0].children[0].value = this.response[i].name;
                                trainingsTable.rows[i+1].cells[1].children[0].value = this.response[i].level;
                                trainingsTable.rows[i+1].cells[2].children[0].value = this.response[i].shortDescription;
                                trainingsTable.rows[i+1].cells[3].children[0].value = this.response[i].URL;
                                trainingsTable.rows[i+1].cells[4].children[0].value = this.response[i].goal;
                                trainingsTable.rows[i+1].cells[5].children[0].value = this.response[i].length;
                                trainingsTable.rows[i+1].cells[6].children[0].value = this.response[i].language;

                            }
                        }
                    }
                });




            }
        }

        });



        /*
        var skillData = {
            name: document.getElementById('newSkillName').value,
            description: document.getElementById('newSkillDesc').value,
            skillIcon: document.getElementById('newSkillIcon').value,
            categoryName: catSelect.value,
            maxPoint: pointsNum,
            pointDescription: pointDescription,
            parents: parents,
            //children: children,
            trainings: trainings,
            forApprove: document.getElementById('forApprove').checked
        };*/
    }

    var catSelect = document.getElementById("newSkillCat");
    catSelect.innerHTML = "";
    for (var i = 0; i < data.categories.length; ++i) {
        var option = document.createElement("option");
        option.text = data.categories[i].name;
        catSelect.add(option);
    }


    //get the save skill button, write the onclick function
    var save = document.getElementById("saveSkillBtn");
    save.onclick = function () {
        var pointsTable = document.getElementById('pointsTable');
        var pointsNum = pointsTable.rows.length - 1;
        var pointDescription = [];
        for (i = 1; i < pointsNum + 1; ++i) pointDescription.push(pointsTable.rows[i].cells[1].children[0].value);

        var parentsTable = document.getElementById('parentsTable');
        var parents = [];
        for (i = 1; i < parentsTable.rows.length; ++i) {
            parents.push({
                name: parentsTable.rows[i].cells[0].children[0].value,
                minPoint: parentsTable.rows[i].cells[1].children[0].value,
                recommended: !parentsTable.rows[i].cells[2].children[0].checked
            });
        }

        /*var childrenTable = document.getElementById('childrenTable');
        var children = [];
        for (i = 1; i < childrenTable.rows.length; ++i) {
            children.push({
                name: childrenTable.rows[i].cells[0].children[0].value,
                minPoint: childrenTable.rows[i].cells[1].children[0].value,
                recommended: !childrenTable.rows[i].cells[2].children[0].checked
            });
        }*/


        var trainingsTable = document.getElementById('trainingsTable');
        var trainings = [];
        for (i = 1; i < trainingsTable.rows.length; ++i) {
            trainings.push({
                name: trainingsTable.rows[i].cells[0].children[0].value,
                level: trainingsTable.rows[i].cells[1].children[0].value,
                shortDescription: trainingsTable.rows[i].cells[2].children[0].value,
                URL: trainingsTable.rows[i].cells[3].children[0].value,
                goal: trainingsTable.rows[i].cells[4].children[0].value,
                length: trainingsTable.rows[i].cells[5].children[0].value,
                language: trainingsTable.rows[i].cells[6].children[0].value
            });
        }

        var skillData = {
            name: document.getElementById('newSkillName').value,
            description: document.getElementById('newSkillDesc').value,
            skillIcon: document.getElementById('newSkillIcon').value,
            categoryName: catSelect.value,
            maxPoint: pointsNum,
            pointDescription: pointDescription,
            parents: parents,
            //children: children,
            trainings: trainings,
            forApprove: true
        };

        request('POST', '/set/newskill', skillData, function () {
            if (this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                    modal.style.display = "none";
                }
            }
        });
    };
}

// opens tree creator and manages it.
function createTree () {
    hideAll();

    var treeName = document.getElementById("treeName");
    treeName.setAttribute('list', '');
    treeName.onkeyup = undefined;

    var creator = document.getElementById("creator");
    creator.style.display = "grid";

    var loadTree = document.getElementById("loadTree");
    loadTree.style.display = "none";

    var canvas = document.getElementById("pixiCanvas");

    creator.style.width = canvas.style.width;
    creator.style.height = canvas.style.height;

    var addBtn = document.getElementById("addToTree");
    var skillList = document.getElementById("skillList");
    var skillsToAdd = [];
    addBtn.onclick = function () {
        var skill = {value: document.getElementById('skillSearchTree').value};

        request('POST', '/set/getskill', skill, function() {
            if(this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                    if (skillsToAdd.find(obj => obj.name == this.response.skill.name) == undefined) {
                        if (this.response.dependency.length > 0) {
                            var text = "The selected skill depends on the following skills. Do you want to add these?\n";
                            for (var i = 0; i < this.response.dependency.length; ++i) {
                                text += this.response.dependency[i].name + "\n";
                            }
                            if (confirm(text)) {
                                skillsToAdd.push(this.response.skill);
                                var option = document.createElement("option");
                                option.text = this.response.skill.name;
                                skillList.add(option);
                                for (var i = 0; i < this.response.dependency.length; ++i) {
                                    if (skillsToAdd.find(obj => obj.name == this.response.dependency[i].name) == undefined) {
                                        skillsToAdd.push(this.response.dependency[i]);
                                        var option = document.createElement("option");
                                        option.text = this.response.dependency[i].name;
                                        skillList.add(option);
                                    }
                                }
                            }
                        } else {
                            skillsToAdd.push(this.response.skill);
                            var option = document.createElement("option");
                            option.text = this.response.skill.name;
                            skillList.add(option);
                        }
                    } else alert("You have already added this skill");
                } else alert("Skill is not found");
            }
        });
    };

    var createSkillBtn = document.getElementById("createSkill");
    createSkillBtn.onclick = createSkill;

    var deleteBtn = document.getElementById("deleteFromList");
    deleteBtn.onclick = function () {
        var children = [];
        getChildren(skillsToAdd, skillsToAdd.find(obj => obj.name == skillList.options[skillList.selectedIndex].text), children);

        if (children.length == 0) {
            skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
            skillList.remove(skillList.selectedIndex);
        } else {
            var text = "The following skills depend on the selected. Do you want to delete them?\n";
            for (var i = 0; i < children.length; ++i) {
                text += children[i].name + "\n";
            }
            if (confirm(text)) {
                skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
                skillList.remove(skillList.selectedIndex);
                for (var i = 0; i < children.length; ++i) {
                    skillsToAdd = skillsToAdd.filter(obj => obj.name != children[i].name);
                    for (var j = 0; j < skillList.options.length; ++j) {
                        if (skillList.options[j].text == children[i].name) skillList.remove(j);
                    }
                }
            }
        }
    };

    var createBtn = document.getElementById("createTree");
    createBtn.onclick = function () {
        if (document.getElementById('treeName').value.length > 0) {
            if (skillsToAdd.length > 0) {
                /*var skillNames = [];
                for (var i = 0; i < skillsToAdd.length; ++i) skillNames.push(skillsToAdd[i].name);*/

                var treeData = {
                    name: document.getElementById('treeName').value,
                    focusArea: document.getElementById('focusarea').value,
                    forApprove: true,
                    skills: skillsToAdd
                };

                request('POST', '/set/newtree', treeData, function () {
                    if (this.readyState == 4 && this.status == 200) {
                        if (this.response.success) window.open("/user/", "_self");
                        else if (this.response.message == "treeexists") alert("There is already a tree with this name");
                    }
                });
            } else alert("Please add at least one skill to the tree");
        } else alert("Please provide a name to the tree");
    };
}

// deletes a row from a table
function deleteRow(table, row) {
  var i = row.parentNode.parentNode.rowIndex;
  document.getElementById(table).deleteRow(i);
}



// adds a row to a table
function addRow(table) {
    console.log(table);
  var x = document.getElementById(table);
  var new_row = x.rows[1].cloneNode(true);
  var len = x.rows.length;
  if (table == 'pointsTable') new_row.cells[0].innerText = len;

  var inp1 = new_row.cells[1].getElementsByTagName('input')[0];
  inp1.id += len;
  inp1.value = '';
  x.appendChild(new_row);
}

/*
*   TREE CREATOR END
*/

/*
*   Approve menu for admins
*/

// opens tree creator and manages it.
function editMyTree () {
    hideAll();

    var treeName = document.getElementById("treeName");
    treeName.setAttribute('list', 'TreeSearchResult');
    treeName.onkeyup = function() {searchTreesByName(treeName, false)};

    var loadTree = document.getElementById("loadTree");
    loadTree.style.display = "block";

    var creator = document.getElementById("creator");
    creator.style.display = "grid";

    var canvas = document.getElementById("pixiCanvas");

    creator.style.width = canvas.style.width;
    creator.style.height = canvas.style.height;

    var skillList = document.getElementById("skillList");
    var skillsToAdd = [];
    loadTree.onclick = function () {
        var tree = data.trees.find(obj => obj.name == document.getElementById("treeName").value);

        if (tree == undefined) alert("Tree is not found");
        else {
            document.getElementById("focusarea").value = tree.focusArea;
            for (var i = 0; i < tree.skillNames.length; ++i) {
                skillsToAdd.push(data.skills.find(obj => obj.name == tree.skillNames[i]));
                var option = document.createElement("option");
                option.text = tree.skillNames[i];
                skillList.add(option);
            }
        }
    };

    var addBtn = document.getElementById("addToTree");
    addBtn.onclick = function () {
        var skill = {value: document.getElementById('skillSearchTree').value};

        request('POST', '/set/getskill', skill, function() {
            if(this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                    if (skillsToAdd.find(obj => obj.name == this.response.skill.name) == undefined) {
                        if (this.response.dependency.length > 0) {
                            var text = "The selected skill depends on the following skills. Do you want to add these?\n";
                            for (var i = 0; i < this.response.dependency.length; ++i) {
                                text += this.response.dependency[i].name + "\n";
                            }
                            if (confirm(text)) {
                                skillsToAdd.push(this.response.skill);
                                var option = document.createElement("option");
                                option.text = this.response.skill.name;
                                skillList.add(option);
                                for (var i = 0; i < this.response.dependency.length; ++i) {
                                    if (skillsToAdd.find(obj => obj.name == this.response.dependency[i].name) == undefined) {
                                        skillsToAdd.push(this.response.dependency[i]);
                                        var option = document.createElement("option");
                                        option.text = this.response.dependency[i].name;
                                        skillList.add(option);
                                    }
                                }
                            }
                        } else {
                            skillsToAdd.push(this.response.skill);
                            var option = document.createElement("option");
                            option.text = this.response.skill.name;
                            skillList.add(option);
                        }
                    } else alert("You have already added this skill");
                } else alert("Skill is not found");
            }
        });
    };

    var createSkillBtn = document.getElementById("createSkill");
    createSkillBtn.onclick = createSkill;

    var deleteBtn = document.getElementById("deleteFromList");
    deleteBtn.onclick = function () {
        var children = [];
        getChildren(skillsToAdd, skillsToAdd.find(obj => obj.name == skillList.options[skillList.selectedIndex].text), children);

        if (children.length == 0) {
            skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
            skillList.remove(skillList.selectedIndex);
        } else {
            var text = "The following skills depend on the selected. Do you want to delete them?\n";
            for (var i = 0; i < children.length; ++i) {
                text += children[i].name + "\n";
            }
            if (confirm(text)) {
                skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
                skillList.remove(skillList.selectedIndex);
                for (var i = 0; i < children.length; ++i) {
                    skillsToAdd = skillsToAdd.filter(obj => obj.name != children[i].name);
                    for (var j = 0; j < skillList.options.length; ++j) {
                        if (skillList.options[j].text == children[i].name) skillList.remove(j);
                    }
                }
            }
        }
    };

    var createBtn = document.getElementById("createTree");
    createBtn.onclick = function () {
        if (document.getElementById('treeName').value.length > 0) {
            if (skillsToAdd.length > 0) {
                for (var i = 0; i < skillsToAdd.length; ++i) {
                    delete skillsToAdd[i].itemcontainer;
                }

                var treeData = {
                    name: document.getElementById('treeName').value,
                    focusArea: document.getElementById('focusarea').value,
                    skills: skillsToAdd
                };

                request('POST', '/set/editmytree', treeData, function () {
                    if (this.readyState == 4 && this.status == 200) {
                        if (this.response.success) window.open("/user/", "_self");
                    }
                });
            } else alert("Please add at least one skill to the tree");
        } else alert("Please provide a name to the tree");
    };
}

// global (for admins)
function editTree () {
    hideAll();

    var treeName = document.getElementById("treeName");
    treeName.setAttribute('list', 'TreeSearchResult');
    treeName.onkeyup = function() {searchTreesByName(treeName, true)};

    var loadTree = document.getElementById("loadTree");
    loadTree.style.display = "block";

    var creator = document.getElementById("creator");
    creator.style.display = "grid";

    var canvas = document.getElementById("pixiCanvas");

    creator.style.width = canvas.style.width;
    creator.style.height = canvas.style.height;

    var skillList = document.getElementById("skillList");
    var skillsToAdd = [];
    loadTree.onclick = function () {
        skillsToAdd = [];
        skillList.innerHTML = "";

        request('POST', '/set/gettree', {name: document.getElementById("treeName").value}, function() {
            if(this.readyState == 4 && this.status == 200) {
                TreeSearchResult.innerHTML = "";
                document.getElementById("focusarea").value = this.response.focusArea;
                for (var i = 0; i < this.response.skillNames.length; ++i) {
                    skillsToAdd.push(data.skills.find(obj => obj.name == this.response.skillNames[i]));
                    var option = document.createElement("option");
                    option.text = this.response.skillNames[i];
                    skillList.add(option);
                }
            }
        });
    };

    var addBtn = document.getElementById("addToTree");
    addBtn.onclick = function () {
        var skill = {value: document.getElementById('skillSearchTree').value};

        request('POST', '/set/getskill', skill, function() {
            if(this.readyState == 4 && this.status == 200) {
                if (this.response.success) {
                    if (skillsToAdd.find(obj => obj.name == this.response.skill.name) == undefined) {
                        if (this.response.dependency.length > 0) {
                            var text = "The selected skill depends on the following skills. Do you want to add these?\n";
                            for (var i = 0; i < this.response.dependency.length; ++i) {
                                text += this.response.dependency[i].name + "\n";
                            }
                            if (confirm(text)) {
                                skillsToAdd.push(this.response.skill);
                                var option = document.createElement("option");
                                option.text = this.response.skill.name;
                                skillList.add(option);
                                for (var i = 0; i < this.response.dependency.length; ++i) {
                                    if (skillsToAdd.find(obj => obj.name == this.response.dependency[i].name) == undefined) {
                                        skillsToAdd.push(this.response.dependency[i]);
                                        var option = document.createElement("option");
                                        option.text = this.response.dependency[i].name;
                                        skillList.add(option);
                                    }
                                }
                            }
                        } else {
                            skillsToAdd.push(this.response.skill);
                            var option = document.createElement("option");
                            option.text = this.response.skill.name;
                            skillList.add(option);
                        }
                    } else alert("You have already added this skill");
                } else alert("Skill is not found");
            }
        });
    };

    var createSkillBtn = document.getElementById("createSkill");
    createSkillBtn.onclick = createSkill;

    var deleteBtn = document.getElementById("deleteFromList");
    deleteBtn.onclick = function () {
        var children = [];
        getChildren(skillsToAdd, skillsToAdd.find(obj => obj.name == skillList.options[skillList.selectedIndex].text), children);

        if (children.length == 0) {
            skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
            skillList.remove(skillList.selectedIndex);
        } else {
            var text = "The following skills depend on the selected. Do you want to delete them?\n";
            for (var i = 0; i < children.length; ++i) {
                text += children[i].name + "\n";
            }
            if (confirm(text)) {
                skillsToAdd = skillsToAdd.filter(obj => obj.name != skillList.options[skillList.selectedIndex].text);
                skillList.remove(skillList.selectedIndex);
                for (var i = 0; i < children.length; ++i) {
                    skillsToAdd = skillsToAdd.filter(obj => obj.name != children[i].name);
                    for (var j = 0; j < skillList.options.length; ++j) {
                        if (skillList.options[j].text == children[i].name) skillList.remove(j);
                    }
                }
            }
        }
    };

    var createBtn = document.getElementById("createTree");
    createBtn.onclick = function () {
        if (document.getElementById('treeName').value.length > 0) {
            if (skillsToAdd.length > 0) {
                for (var i = 0; i < skillsToAdd.length; ++i) {
                    delete skillsToAdd[i].itemcontainer;
                }

                var treeData = {
                    name: document.getElementById('treeName').value,
                    focusArea: document.getElementById('focusarea').value,
                    skills: skillsToAdd
                };

                request('POST', '/set/edittree', treeData, function () {
                    if (this.readyState == 4 && this.status == 200) {
                        if (this.response.success) window.open("/user/", "_self");
                    }
                });
            } else alert("Please add at least one skill to the tree");
        } else alert("Please provide a name to the tree");
    };
}

function getChildren (skills, skill, children) {
	var temp = [];
	for (var i = 0; skill.children != undefined && i < skill.children.length; ++i) {
        var child = skills.find(obj => obj.name == skill.children[i].name);

        if (child != undefined) {
            temp.push(child);
            children.push(child);
        }
	}

	for (var i = 0; i < temp.length; ++i) {
        if (skills.find(obj => obj.name == temp[i].name) != undefined) getChildren(skills, temp[i], children);
	}
}

// make trees globally available
function approveTrees() {
    hideAll();

    var approveTrees = document.getElementById("approveTrees");
    approveTrees.style.display = "block";

    var btn = document.getElementById('approveTreesBtn');
    var select = document.getElementById('apprTreeSel');

    for (var i = 0; i < data.apprTrees.length; ++i) {
        var text = data.apprTrees[i].name + " (" + data.apprTrees[i].username + ")";
        var option = document.createElement('option');
        option.value = option.text = text;
        option.name = data.apprTrees[i].name;
        option.username = data.apprTrees[i].username;
        select.add(option);
    }

    btn.onclick = function () {
        var selectedTraining = select.options[select.selectedIndex]
        request('POST', '/set/approvetree', {
            name: selectedTraining.name,
            username: selectedTraining.username
        }, function () {
            if (this.readyState == 4 && this.status == 200) {
                window.open("/user/", "_self");
            }
        });
    };
}

// make skills globally available
function approveSkills() {
    hideAll();

    var approveSkills = document.getElementById("approveSkills");

    approveSkills.style.display = "block";

    var approveSkillsSelect = document.getElementById('apprSkillSel');
    var skillsforapproval = undefined;

    request('GET', '/get/skillsforapproval', undefined, function() {
        if (this.readyState == 4 && this.status == 200) {
            if (this.response !== undefined) {
                approveSkillsSelect.innerHTML = "";

                skillsforapproval = this.response;
                for (var i = 0; i < skillsforapproval.length; i++) {
                    var text = skillsforapproval[i].name + " (" + skillsforapproval[i].username + ")";
                    var option = document.createElement('option');
                    option.value = skillsforapproval[i];
                    option.text = text;
                    approveSkillsSelect.add(option);
                }

            }
        }
    });



    var approveButton = document.getElementById("approvebtn");
    approveButton.onclick = function() {
        var selectedSkill = approveSkillsSelect.options[approveSkillsSelect.selectedIndex].text;

        var skillforapproval = skillsforapproval.find(obj => obj.name == selectedSkill);

        request('POST', '/set/approveskill', skillforapproval, function(){
            if(this.readyState == 4 && this.status == 200){
                if(this.response !== undefined){
                    alert(this.response.message);
                }
            }

        });
    }
/*
    for (var i = 0; i < data.apprSkills.length; ++i) {
        var text = data.apprSkills[i].name + " (" + data.apprSkills[i].username + ")";
        var option = document.createElement('option');
        option.value = option.text = text;
        document.getElementById('apprSkillSel').add(option);
    }
*/
   //Making the approve page visible

}

function approveTrainings () {
    hideAll();

    var approveTrees = document.getElementById("approveTrainings");
    approveTrees.style.display = "block";

    var select = document.getElementById('apprTrainingSel');
    var btn = document.getElementById('approveTrainingsBtn');

    for (var i = 0; i < data.apprTrainings.length; ++i) {
        var text = data.apprTrainings[i].name + " (" + data.apprTrainings[i].skillName + ", " +  data.apprTrainings[i].username + ")";
        var option = document.createElement('option');
        option.name = data.apprTrainings[i].name;
        option.skillName = data.apprTrainings[i].skillName;
        option.username = data.apprTrainings[i].username;
        option.text = text;
        select.add(option);
    }

    btn.onclick = function () {
        var selectedTraining = select.options[select.selectedIndex]
        request('POST', '/set/approvetraining', {
            name: selectedTraining.name,
            skillName: selectedTraining.skillName,
            username: selectedTraining.username
        }, function () {
            if (this.readyState == 4 && this.status == 200) {
                window.open("/user/", "_self");
            }
        });
    };
}

function addCheckBox(id, boxText, parent){
  var divToAdd = document.createElement('div');
  divToAdd.className = "advSearchDetailsItem";
  var spanToAdd = document.createElement('span');
  var boxToAdd = document.createElement('input');
  boxToAdd.type = "checkbox";
  boxToAdd.id = id;
  spanToAdd.appendChild(boxToAdd);
  spanToAdd.innerHTML += boxText;
  divToAdd.appendChild(spanToAdd);
  document.getElementById(parent).appendChild(divToAdd);
}

// drops all offers from all users (used for dev)
function dropoffers() {
    request('POST', '/set/dropoffers', undefined , function () {
        if (this.readyState == 4 && this.status == 200) {
            window.open("/user/", "_self");
        }
    });

}

/*
*   Approve menu for admins end
*/

function hideAll () {
    var elements = document.getElementsByClassName("hide");

    for (var i = 0; i < elements.length; ++i) {
        elements[i].style.display = "none";
    }
}

// helper functions

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
}

Array.prototype.sum = function (prop) {
    var total = 0;

    for (var i = 0; i < this.length; ++i) {
        total += this[i][prop];
    }

    return total;
}

function request (type, url, sendData, callback) {
    var req = new XMLHttpRequest();
    req.open(type, url, true);
    req.setRequestHeader('Content-type', 'application/json');
    req.setRequestHeader('x-access-token', localStorage.getItem("loginToken"));
    req.responseType = "json";
    req.onreadystatechange = callback;

    if (sendData !== undefined)
        req.send(JSON.stringify(sendData));
    else
        req.send();
}
