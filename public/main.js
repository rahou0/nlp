var mytree = [];
var object_counter = 1;
var selected_node = null;
var control_type = null;
var currentGizmoRotation = new x3dom.fields.SFMatrix4f();
var clicked = null;
var currentGizmoRotationOffset = new x3dom.fields.SFMatrix4f();
var i = 1;
const axis = {
  x: {
    color: "1 0.3 0.3",
    autoOffset: "autoOffset='false'",
    axisRotation: "axisRotation='0 0 1 -1.57'",
    rotation: "",
  },
  y: {
    color: "0.3 1 0.3",
    autoOffset: "autoOffset='false'",
    axisRotation: "",
    rotation: "rotation='0 0 1 -1.57'",
  },
  z: {
    color: "0.3 0.3 1",
    autoOffset: "autoOffset='false'",
    axisRotation: "axisRotation='1 0 0 -1.57'",
    rotation: "rotation='0 1 0 -1.57'",
  },
};
const loadData = () => {
  fetch("/shapes")
    .then((response) => response.json())
    .then(({ shapes }) => {
      if (shapes.length === 0) return;
      shapes.map((shape) => {
        const shape_div = `<div id='shape_box'> <img src='${shape.img_url}' alt='${shape.name}'/> <p>${shape.name}</p> <button class='btn btn-primary' onclick='insertShapeToScene("${shape.name}","${shape.url}","${shape.img_url}")'>ADD </button></div>`;
        $("#objects_container").append(shape_div);
      });
    });
};

loadData();

const insertShapeToScene = (name, url) => {
  const id = name + "_" + object_counter;
  mytree.push({
    text: `${id} ${creatDeleteShapeButton(id)} ${creatUpdateShapeButton(id)}`,
    id: id,
  });
  selected_node = id;
  $("#selected_shape").text(selected_node);
  const new_object = ` <transform id='T_${id}'> <matrixTransform id='R_${id}'>   <inline url='${url}'></inline> </matrixTransform></transform>`;
  $("#scene3d").append(new_object);
  $("#t_x").val(0);
  $("#t_y").val(0);
  $("#t_z").val(0);
  $("#r_x").val(0);
  $("#r_y").val(0);
  $("#r_z").val(0);
  if (control_type == null) control_type = "r_btn";
  console.log(control_type == null);
  switch (control_type) {
    case "r_btn":
      $(".rotationAxisControllers").remove();
      $(`#T_${id}`).append(createRotationAxis(axis.x));
      $(`#T_${id}`).append(createRotationAxis(axis.y));
      $(`#T_${id}`).append(createRotationAxis(axis.z));
      $(".view").removeClass("btn-primary").addClass("btn-secondary");
      $("#r_btn").removeClass("btn-secondary").addClass("btn-primary");
      break;
    case "t_btn":
      $(".translationAxisControllers").remove();
      $(`#T_${selected_node}`).append(createTranslationAxis(""));
      $(".view").removeClass("btn-primary").addClass("btn-secondary");
      $("#t_btn").removeClass("btn-secondary").addClass("btn-primary");
      break;
    default:
      $(".view").removeClass("btn-primary").addClass("btn-secondary");
      $("#n_btn").removeClass("btn-secondary").addClass("btn-primary");
      break;
  }
  $("#tree").treeview({
    data: mytree,
    onNodeSelected: function (event, data) {
      if (selected_node === data.id) return;
      selected_node = data.id;
      $("#selected_shape").text(selected_node);
      switch (control_type) {
        case "r_btn":
          $(".rotationAxisControllers").remove();
          $(`#T_${selected_node}`).append(createRotationAxis(axis.x));
          $(`#T_${selected_node}`).append(createRotationAxis(axis.y));
          $(`#T_${selected_node}`).append(createRotationAxis(axis.z));
          break;
        case "t_btn":
          $(".translationAxisControllers").remove();
          $(`#T_${selected_node}`).append(createTranslationAxis(""));
          break;
        default:
          break;
      }
    },
  });
  object_counter++;
};
function applyRotationGizmoTransformations() {
  var node = document.getElementById("R_" + selected_node);

  //incorporate the current rotation offset, interpreted globally, into the stored rotation value
  var transformMatrix = currentGizmoRotationOffset.mult(currentGizmoRotation);
  //set matrix value in column major format, as required by the MatrixTransform node
  node.setFieldValue("matrix", transformMatrix.transpose());
}
function processRotationGizmoEvent(event, id) {
  var sensorToWorldMatrix, rotationMatrixWorld;
  if (event.fieldName === "rotation_changed") {
    sensorToWorldMatrix = x3dom.fields.SFMatrix4f.parseRotation(
      event.target.getAttribute("axisRotation")
    );

    rotationMatrixWorld = sensorToWorldMatrix.mult(event.value.toMatrix());
    currentGizmoRotationOffset = rotationMatrixWorld.mult(
      sensorToWorldMatrix.inverse()
    );
    applyRotationGizmoTransformations();
  }
  if (event.fieldName === "isActive" && event.value === false) {
    currentGizmoRotation =
      currentGizmoRotationOffset.mult(currentGizmoRotation);
    currentGizmoRotationOffset = new x3dom.fields.SFMatrix4f();
    applyRotationGizmoTransformations(id);
  }
}
const removeShapeFromScene = (id) => {
  $(`#T_${id}`).remove();
  mytree = mytree.filter(
    (node) =>
      node.text !==
      `${id} ${creatDeleteShapeButton(id)} ${creatUpdateShapeButton(id)}`
  );
  $("#tree").treeview({ data: mytree });
};
const creatDeleteShapeButton = (id) => {
  return `<button type='button' class='btn btn-danger btn-sm'  onclick='removeShapeFromScene("${id}")'>D</button>`;
};
const creatUpdateShapeButton = (id) => {
  return `<button type='button' class='btn btn-primary btn-sm' onclick='updateShapeFromScene("${id}")'  data-bs-toggle="modal" data-bs-target="#shapeUpdate">U</button>`;
};
const updateShapeFromScene = (id) => {
  $("#modeltitle").text(id);
  $.get(
    "shapes/cone.x3d",
    function (contents) {
      $("#modelbodydata").text(contents);
    },
    "text"
  );
};

const createRotationAxis = (axis) => {
  return `
  <group class="rotationAxisControllers">
  <cylinderSensor ${axis.autoOffset} ${axis.axisRotation} onoutputchange='processRotationGizmoEvent(event);'>
    </cylinderSensor>
    <transform>
    <transform scale='2.5 5.1 5.1' ${axis.rotation}>
  <shape>
    <appearance><material diffuseColor='${axis.color}'></material></appearance>
    <indexedtriangleset solid="true" normalpervertex="true" index="0 1 2 0 2 3 4 5 6 4 6 7 8 9 10 8 10 11 12 0 3 12 3 13 14 4 7 14 7 15 16 8 11 16 11 17 18 14 15 18 15 19 20 16 17 20 17 21 22 18 19 22 19 23 24 20 21 24 21 25 26 22 23 26 23 27 28 24 25 28 25 29 1 26 27 1 27 2 5 28 29 5 29 6 27 23 30 27 30 31 29 25 32 29 32 33 2 27 31 2 31 34 6 29 33 6 33 35 3 2 34 3 34 36 7 6 35 7 35 37 11 10 38 11 38 39 13 3 36 13 36 40 15 7 37 15 37 41 17 11 39 17 39 42 19 15 41 19 41 43 21 17 42 21 42 44 23 19 43 23 43 30 25 21 44 25 44 32 45 46 47 45 47 48 49 50 51 49 51 52 53 45 48 53 48 54 55 49 52 55 52 56 57 53 54 57 54 58 59 55 56 59 56 60 61 57 58 61 58 62 63 59 60 63 60 64 65 61 62 65 62 66 67 63 64 67 64 68 69 70 71 69 71 72 73 65 66 73 66 74 46 67 68 46 68 47 50 69 72 50 72 51 66 62 75 66 75 76 68 64 77 68 77 78 72 71 79 72 79 80 74 66 76 74 76 81 47 68 78 47 78 82 51 72 80 51 80 83 48 47 82 48 82 84 52 51 83 52 83 85 54 48 84 54 84 86 56 52 85 56 85 87 58 54 86 58 86 88 60 56 87 60 87 89 62 58 88 62 88 75 64 60 89 64 89 77 13 90 91 13 91 12 70 92 93 70 93 71 9 94 93 9 93 10 90 13 40 90 40 95 74 90 95 74 95 73 94 79 71 94 71 93 90 74 81 90 81 91 92 38 10 92 10 93 ">
        <coordinate point="-0.126178 0.375330 -0.923880 -0.126178 0.544895 -0.831470 0.000000 0.555570 -0.831470 0.000000 0.382684 -0.923880 -0.126178 0.980785 0.000000 -0.126178 0.961940 0.195090 0.000000 0.980785 0.195090 0.000000 1.000000 0.000000 -0.126178 0.375331 0.923880 -0.126178 0.191342 0.980785 0.000000 0.195091 0.980785 0.000000 0.382684 0.923880 -0.126178 0.191342 -0.980785 0.000000 0.195090 -0.980785 -0.126178 0.961940 -0.195090 0.000000 0.980785 -0.195090 -0.126178 0.544895 0.831470 0.000000 0.555570 0.831470 -0.126178 0.906128 -0.382683 0.000000 0.923880 -0.382683 -0.126178 0.693520 0.707107 0.000000 0.707107 0.707107 -0.126178 0.815493 -0.555570 0.000000 0.831470 -0.555570 -0.126178 0.815493 0.555570 0.000000 0.831470 0.555570 -0.126178 0.693520 -0.707107 0.000000 0.707107 -0.707107 -0.126178 0.906128 0.382683 0.000000 0.923880 0.382683 0.126178 0.815493 -0.555570 0.126178 0.693520 -0.707107 0.126178 0.815493 0.555570 0.126178 0.906128 0.382683 0.126178 0.544895 -0.831470 0.126178 0.961940 0.195090 0.126178 0.375330 -0.923880 0.126178 0.980785 0.000000 0.126178 0.191342 0.980785 0.126178 0.375330 0.923880 0.126178 0.191342 -0.980785 0.126178 0.961940 -0.195090 0.126178 0.544895 0.831470 0.126178 0.906128 -0.382683 0.126178 0.693520 0.707107 0.126178 -0.906128 -0.382683 0.126178 -0.961940 -0.195090 0.000000 -0.980785 -0.195090 0.000000 -0.923880 -0.382683 0.126178 -0.693520 0.707107 0.126178 -0.544895 0.831470 0.000000 -0.555570 0.831470 0.000000 -0.707107 0.707107 0.126178 -0.815493 -0.555570 0.000000 -0.831469 -0.555570 0.126178 -0.815493 0.555570 0.000000 -0.831469 0.555570 0.126178 -0.693520 -0.707107 0.000000 -0.707107 -0.707107 0.126178 -0.906127 0.382683 0.000000 -0.923879 0.382683 0.126178 -0.544895 -0.831470 0.000000 -0.555570 -0.831470 0.126178 -0.961940 0.195090 0.000000 -0.980785 0.195090 0.126178 -0.375330 -0.923880 0.000000 -0.382683 -0.923880 0.126178 -0.980785 0.000000 0.000000 -1.000000 0.000000 0.126178 -0.375330 0.923880 0.126178 -0.191342 0.980785 0.000000 -0.195090 0.980785 0.000000 -0.382684 0.923880 0.126178 -0.191342 -0.980785 0.000000 -0.195090 -0.980785 -0.126178 -0.544895 -0.831470 -0.126178 -0.375330 -0.923880 -0.126178 -0.961939 0.195090 -0.126178 -0.980785 0.000000 -0.126178 -0.191342 0.980785 -0.126178 -0.375330 0.923880 -0.126178 -0.191342 -0.980785 -0.126178 -0.961939 -0.195090 -0.126178 -0.544895 0.831470 -0.126178 -0.906127 -0.382683 -0.126178 -0.693520 0.707107 -0.126178 -0.815493 -0.555570 -0.126178 -0.815493 0.555570 -0.126178 -0.693520 -0.707107 -0.126178 -0.906127 0.382683 0.000000 0.000000 -1.012271 -0.126178 0.000000 -1.012271 0.126178 0.000000 1.012271 0.000000 0.000000 1.012271 -0.126178 0.000000 1.012271 0.126178 0.000000 -1.012271 " />
        <normal vector="-0.023133 0.382550 -0.923643 -0.047182 0.554918 -0.830561 0.000000 0.562792 -0.826563 0.000000 0.388867 -0.921262 -0.149113 0.988800 0.000000 -0.143559 0.970611 0.193060 0.000000 0.981445 0.191626 0.000000 1.000000 0.000000 -0.023133 0.382550 0.923643 -0.007538 0.226142 0.974059 0.000000 0.228553 0.973510 0.000000 0.388867 0.921262 -0.007538 0.226142 -0.974059 0.000000 0.228553 -0.973510 -0.143559 0.970611 -0.193060 0.000000 0.981445 -0.191626 -0.047182 0.554918 0.830561 0.000000 0.562792 0.826563 -0.127689 0.916288 -0.379559 0.000000 0.926359 -0.376629 -0.075533 0.705039 0.705100 0.000000 0.713675 0.700430 -0.103824 0.826930 -0.552568 0.000000 0.836207 -0.548387 -0.103824 0.826930 0.552568 0.000000 0.836207 0.548387 -0.075533 0.705039 -0.705100 0.000000 0.713675 -0.700430 -0.127689 0.916288 0.379559 0.000000 0.926359 0.376629 0.103824 0.826930 -0.552568 0.075533 0.705039 -0.705100 0.103824 0.826930 0.552568 0.127689 0.916288 0.379559 0.047182 0.554918 -0.830561 0.143559 0.970611 0.193060 0.023133 0.382550 -0.923643 0.149113 0.988800 0.000000 0.007538 0.226142 0.974059 0.023133 0.382550 0.923643 0.007538 0.226142 -0.974059 0.143559 0.970611 -0.193060 0.047182 0.554918 0.830561 0.127689 0.916288 -0.379559 0.075533 0.705039 0.705100 0.127689 -0.916288 -0.379559 0.143559 -0.970611 -0.193060 0.000000 -0.981445 -0.191626 0.000000 -0.926359 -0.376629 0.075533 -0.705039 0.705100 0.047182 -0.554918 0.830561 0.000000 -0.562792 0.826563 0.000000 -0.713706 0.700430 0.103824 -0.826930 -0.552568 0.000000 -0.836207 -0.548387 0.103824 -0.826960 0.552568 0.000000 -0.836207 0.548387 0.075533 -0.705039 -0.705100 0.000000 -0.713706 -0.700430 0.127689 -0.916288 0.379559 0.000000 -0.926359 0.376629 0.047182 -0.554918 -0.830561 0.000000 -0.562792 -0.826563 0.143559 -0.970611 0.193060 0.000000 -0.981445 0.191626 0.023133 -0.382550 -0.923643 0.000000 -0.388867 -0.921262 0.149113 -0.988800 0.000000 0.000000 -1.000000 0.000000 0.023133 -0.382550 0.923643 0.007538 -0.226142 0.974059 0.000000 -0.228553 0.973510 0.000000 -0.388867 0.921262 0.007538 -0.226142 -0.974059 0.000000 -0.228553 -0.973510 -0.047182 -0.554918 -0.830561 -0.023133 -0.382550 -0.923643 -0.143559 -0.970611 0.193060 -0.149113 -0.988800 0.000000 -0.007538 -0.226142 0.974059 -0.023133 -0.382550 0.923643 -0.007538 -0.226142 -0.974059 -0.143559 -0.970611 -0.193060 -0.047182 -0.554918 0.830561 -0.127689 -0.916288 -0.379559 -0.075533 -0.705039 0.705100 -0.103824 -0.826930 -0.552568 -0.103824 -0.826960 0.552568 -0.075533 -0.705039 -0.705100 -0.127689 -0.916288 0.379559 0.000000 0.000000 -1.000000 -0.002411 0.000000 -0.999969 0.002411 0.000000 0.999969 0.000000 0.000000 1.000000 -0.002411 0.000000 0.999969 0.002411 0.000000 -0.999969 " />
    </indexedtriangleset>
</shape>
</transform>
</transform>
</group>
`;
};
const createTranslationAxis = (axis) => {
  return `
  <group class="translationAxisControllers">
  <planeSensor autoOffset='true' axisRotation='1 0 0 -1.57' minPosition='-6 0' maxPosition='6 0' onoutputchange='processTranslationGizmoEvent(event)'>
  </planeSensor>
  <transform id='translationHandleTransform'>
    <transform translation='0 0 0' rotation='0 0 0 0'>	

    <transform translation='4.25 0 0' rotation='1 0 90 -1.57' scale="0.5 0.5 0.5">
    <shape DEF='CONE_CAP'>
      <appearance DEF='CYAN_MAT'><material diffuseColor='0.3 0.3 1'></material></appearance>
      <cone height='1'></cone>
    </shape>
  </transform>
  <transform rotation='1 0 90 -1.57' scale="0.3 4 0.3">							
    <shape>
      <appearance USE='CYAN_MAT'></appearance>
      <cylinder></cylinder>
    </shape>
  </transform>
    </transform>						
  </transform>				
  </group>`;
};
function processTranslationGizmoEvent(event) {
  var sensorToWorldMatrix, translationValue;
  if (event.fieldName === "translation_changed") {
    sensorToWorldMatrix = x3dom.fields.SFMatrix4f.parseRotation(
      event.target.getAttribute("axisRotation")
    );
    translationValue = sensorToWorldMatrix.multMatrixVec(event.value);
    document
      .getElementById(`T_${selected_node}`)
      .setFieldValue("translation", translationValue);
    $("#t_x").val(translationValue.x);
    $("#t_y").val(translationValue.y);
    $("#t_z").val(translationValue.z);
  }
}
$(".view").click(function () {
  if (this.id === control_type) return;
  switch (this.id) {
    case "r_btn":
      if (control_type == "t_btn") $(".translationAxisControllers").remove();
      $(`#T_${selected_node}`).append(createRotationAxis(axis.x));
      $(`#T_${selected_node}`).append(createRotationAxis(axis.y));
      $(`#T_${selected_node}`).append(createRotationAxis(axis.z));
      console.log("rotation");
      control_type = this.id;
      break;
    case "t_btn":
      if (control_type == "r_btn") $(".rotationAxisControllers").remove();
      $(`#T_${selected_node}`).append(createTranslationAxis(""));
      console.log("translation");
      control_type = this.id;
      break;
    default:
      console.log("none");
      if (control_type == "r_btn") $(".rotationAxisControllers").remove();
      if (control_type == "t_btn") $(".translationAxisControllers").remove();
      control_type = this.id;
      break;
  }
  $(".view").removeClass("btn-primary").addClass("btn-secondary");
  $(this).removeClass("btn-secondary").addClass("btn-primary");
});
const controlHandler = () => {
  console.log($(this));
  $(this).addClass("btn-sm");
};
$(".input").change(function () {
  console.log("hi");
  console.log($(this).val);
});
$("#r_x").on("change", function () {
  console.log("hi");
});
function printHello() {
  console.log("hello");
}

var event = new Event("input");

// document.getElementById("t_x").addEventListener("input", function () {
//   const coordinates = $(`#T_${selected_node}`).attr("translation");
//   const coord = coordinates.split(",");
//   $(`#T_${selected_node}`).attr(
//     "translation",
//     `${this.value},${coord[1]},${coord[2]}`
//   );
// });
// document.getElementById("t_y").addEventListener("input", function () {
//   const coordinates = $(`#T_${selected_node}`).attr("translation");
//   const coord = coordinates.split(",");
//   $(`#T_${selected_node}`).attr(
//     "translation",
//     `${coord[0]},${this.value},${coord[2]}`
//   );
// });
// document.getElementById("t_z").addEventListener("input", function () {
//   const coordinates = $(`#T_${selected_node}`).attr("translation");
//   const coord = coordinates.split(",");
//   $(`#T_${selected_node}`).attr(
//     "translation",
//     `${coord[0]},${coord[1]},${this.value}`
//   );
// });
// document.getElementById("r_z").addEventListener("input", function () {
//   // console.log(this.value);
//   // const coordinates = $(`#T_${selected_node}`).attr("translation");
//   // const coord = coordinates.split(",");
//   // $(`#T_${selected_node}`).attr(
//   //   "translations",
//   //   `${coord[0]},${coord[1]},${this.value}`
//   // );
// });

var checkExist = setInterval(function () {
  console.log("hi");
  if ($("#x3dom-x3dElement-canvas").length) {
    console.log("Exists!");
    const targetNode = document.getElementById("x3dom-x3dElement-canvas");
    const config = { attributes: true };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === "attributes") {
          const canvas = document.getElementById("x3dom-x3dElement-canvas");
          const canvas_class = canvas.getAttribute("class");
          if (canvas_class == "x3dom-canvas x3dom-canvas-mousedown")
            clicked = true;
          else if (canvas_class == "x3dom-canvas") {
            if (clicked) {
              const coordinates = $(`#T_${selected_node}`).attr("translation");
              console.log(
                "befor",
                $(`#T_${selected_node}`).attr("translation")
              );
              const x = $(`#t_x`).val();
              const y = $(`#t_y`).val();
              const z = $(`#t_z`).val();
              console.log(x, y, z);
              // const coord = coordinates.split(",");
              $(`#T_${selected_node}`).attr("translation", `${x},${y},${z}`);
              $(`#translationHandleTransform`).attr(
                "translation",
                `${x},${y},${z}`
              );
              console.log(
                "after",
                $(`#T_${selected_node}`).attr("translation")
              );
              clicked = null;
            }
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    clearInterval(checkExist);
  }
}, 100);
