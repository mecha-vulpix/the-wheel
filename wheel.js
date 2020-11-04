
const MY_TEAM = ["Agnetha", "Benny", "Björn", "Anni-Frid"];
const MY_ADMIN = ["Stig"];

var options = [];

var startAngle = 0;
// var arc = Math.PI / (options.length / 2);
var arc;
var spinTimeout = null;

var spinArcStart = 10;
var spinTime = 0;
var spinTimeTotal = 0;

var ctx;

var spinButton = "clickToSpin";
var clearButton = "clear";
var nameList = "teammate-names"

function hide(el) {
  el.style.display = 'none';
}

function show(el) {
  el.style.display = 'inline';
}

function byte2Hex(n) {
  var nybHexString = "0123456789ABCDEF";
  return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}

function RGB2Color(r,g,b) {
	return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function getColor(item, maxitem) {
  var phase = 0;
  var center = 128;
  var width = 127;
  var frequency = Math.PI*2/maxitem;

  var red   = Math.sin(frequency*item+2+phase) * width + center;
  var green = Math.sin(frequency*item+0+phase) * width + center;
  var blue  = Math.sin(frequency*item+4+phase) * width + center;

  return RGB2Color(red,green,blue);
}

function drawRouletteWheel() {
  var canvas = document.getElementById("canvas");
  if (canvas.getContext) {
    var outsideRadius = 200;
    var textRadius = 160;
    var insideRadius = 125;

    ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,500,500);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.font = 'bold 14px Helvetica, Arial';

    for(var i = 0; i < options.length; i++) {
      var angle = startAngle + i * arc;
      //ctx.fillStyle = colors[i];
      ctx.fillStyle = getColor(i, options.length);

      ctx.beginPath();
      ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
      ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.shadowOffsetX = -1;
      ctx.shadowOffsetY = -1;
      ctx.shadowBlur    = 0;
      ctx.shadowColor   = "rgb(220,220,220)";
      ctx.fillStyle = "black";
      ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius,
                    250 + Math.sin(angle + arc / 2) * textRadius);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      var text = options[i];
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      ctx.restore();
    }

    //Arrow
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(250 - 4, 250 - (outsideRadius + 5));
    ctx.lineTo(250 + 4, 250 - (outsideRadius + 5));
    ctx.lineTo(250 + 4, 250 - (outsideRadius - 5));
    ctx.lineTo(250 + 9, 250 - (outsideRadius - 5));
    ctx.lineTo(250 + 0, 250 - (outsideRadius - 13));
    ctx.lineTo(250 - 9, 250 - (outsideRadius - 5));
    ctx.lineTo(250 - 4, 250 - (outsideRadius - 5));
    ctx.lineTo(250 - 4, 250 - (outsideRadius + 5));
    ctx.fill();
  }
}

function spin() {
  spinAngleStart = 15;
  spinTime = 0;
  spinTimeTotal = (Math.random() * 2939) + (2 * 2939);
  // spinTimeTotal = 2939; // This looks to be about 1 exact rotation given a spinStartAngle of 15
  rotateWheel();
}

function rotateWheel() {
  spinTime += 30;
  if(spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }
  var spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawRouletteWheel();
  spinTimeout = setTimeout('rotateWheel()', 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  var degrees = startAngle * 180 / Math.PI + 90;
  var arcd = arc * 180 / Math.PI;
  var index = Math.floor((360 - degrees % 360) / arcd);
  ctx.save();
  ctx.font = 'bold 30px Helvetica, Arial';
  var text = options[index]
  ctx.fillText(text, 250 - ctx.measureText(text).width / 2, 250 + 10);
  ctx.restore();

  buildStandupOrder(text);
}

function easeOut(t, b, c, d) {
  var ts = (t/=d)*t;
  var tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

function attachWheelToSpinButton(spinButtonId) {
  document.getElementById(spinButtonId).addEventListener("click", spin);
}

function attachClearButton(clearButtonId) {
  document.getElementById(clearButtonId).addEventListener("click", reset);
}

function updateNames() {
  // document.getElementById(nameList);
  var teammatesBoxes = document.querySelectorAll('input[name=teammates]:checked');
  options = [];
  teammatesBoxes.forEach(teammate => {
    options.push(teammate.value);
  });

  arc = Math.PI / (options.length / 2);

  drawRouletteWheel();
}

function linkTeammatesToWheel() {
  var teammatesBoxes = document.querySelectorAll('input[name=teammates]');
  teammatesBoxes.forEach(teammateBox => {
    teammateBox.addEventListener("change", updateNames);
  });
}

function buildStandupOrder(lead) {
  var teammateNames = [];
  var productNames = [];
  var standupListHtml = "";

  document.querySelectorAll('input[name=teammates]:checked').forEach(teammate => {
    teammateNames.push(teammate.value);
  });

  document.querySelectorAll('input[name=static]:checked').forEach(product => {
    productNames.push(product.value)
  });

  var teamOffset = teammateNames.indexOf(lead);

  // Add all teammates from the random start
  for (var i = 0; i < teammateNames.length; i++) {
    teammate = teammateNames[(teamOffset + i) % teammateNames.length];
    standupListHtml += ("<li>" + teammate + "</li>\n");
  }
  // Add all managers in order
  productNames.forEach(product => {
    standupListHtml += ("<li>" + product + "</li>\n");
  });

  document.getElementById("standupOrder").innerHTML = standupListHtml;

  showLateEntryButtons();
}

function reset() {
  document.getElementById("standupOrder").innerHTML = "";
  document.querySelectorAll('input[type=checkbox]').forEach(checkBox => {
    hide(checkBox.parentNode.querySelector('span'));
  });
  updateNames();
}

function createEligableTeam(eligableTeam) {
  var teamList = document.getElementById("teammate-names");
  var teamListItems = "";
  eligableTeam.forEach(teammateName => {
    teamListItems += "<li><input name='teammates' type='checkbox' value='" + teammateName + "' checked \> ";
    teamListItems += teammateName;
    teamListItems += " <span class='add-late' style='display:none'>(<a class='add-late-button'>add</a>)</span>"
    teamListItems += "</li>\n";
  });
  teamList.innerHTML = teamListItems;
}

function createEligableAdmin(eligableAdmin) {
  var adminList = document.getElementById("admin");
  var adminListItems = "";
  eligableAdmin.forEach(adminName => {
    adminListItems += "<li><input name='static' type='checkbox' value='" + adminName + "' checked \> ";
    adminListItems += adminName;
    adminListItems += " <span class='add-late' style='display:none'>(<a class='add-late-button'>add</a>)</span>"
    adminListItems += "</li>\n";
  });
  adminList.innerHTML = adminListItems;
}

function showLateEntryButtons() {
  document.querySelectorAll('input[type=checkbox]:not(:checked)').forEach(uncheckedBox => {
    show(uncheckedBox.parentNode.querySelector('span'));
  });
}

function attachLateAddButtons() {
  document.querySelectorAll('a.add-late-button').forEach(addLateLink => {
    var name = addLateLink.parentNode.parentNode.querySelector('input').value;
    addLateLink.addEventListener("click", function() {
      addLate(name);
    });
  });
}

function addLate(name) {
  hide(document.querySelector("input[value=" + name +"]").parentNode.querySelector('span'));
  lateElement = document.createElement("li");
  lateElement.innerHTML = name;
  document.getElementById("standupOrder").appendChild(lateElement);
}

createEligableTeam(MY_TEAM);
createEligableAdmin(MY_ADMIN);

updateNames();

linkTeammatesToWheel();
attachLateAddButtons();

attachWheelToSpinButton(spinButton);
attachClearButton(clearButton);
