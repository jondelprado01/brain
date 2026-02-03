<div class="col-lg-12">
    <?php

        //GROUPING STEP_NM TEMP_CLASS
        $step_temp_arr = [];

        foreach ($part_data as $key => $data) {
            $step_temp_arr[$data['STEP']] = [];
            if (!in_array($data['TEMP_CLASS'], $step_temp_arr[$data['STEP']])) {
                array_push($step_temp_arr[$data['STEP']], $data['TEMP_CLASS']);
            }
        }

        // echo "<pre>", var_dump($step_temp_arr), "</pre>";

        $loaded_instance_route = "";
        foreach ($multi_partnum as $key => $multi) {
            $route_id = $key;
                
            if ($loaded_instance_route == "NOT_EQUAL") {
                continue;
            }

        ?>
            <div style="margin-left:25px!important;" class="alert alert-info pt-1 pb-1 mb-2" role="alert">
                <b><?php echo $route_id?> / <?php echo $part_data[0]['SITE']?></b>
            </div>
        <?php

            foreach($multi as $key => $mp){
            ?>
                <div style="margin-left:55px!important;" class="alert alert-info pt-1 pb-1 mb-2 d-flex justify-content-between" role="alert">
                    <strong class="mr-2"><?php echo $mp?> - <?php echo $step_temp_arr[$mp][0] ?></strong>
                </div>

                <div style="margin-left:55px!important;" class="card border-success mb-3">
                    <div class="card-header">PRIMARY</div>
                    <div class="card-body text-success">

                        <table class="table table-bordered">
                            <tbody class="table1">
                                
                            </tbody>
                        </table>

                    </div>
                </div>

                <div style="margin-left:55px!important;" class="card border-warning mb-3" style="max-width: 18rem;">
                    <div class="card-header">ALTERNATE</div>
                    <div class="card-body">

                        <table class="table table-bordered">
                            <tbody class="table2">
                                <?php
                                    foreach ($part_data as $part) {
                                        if ($part['RTE_ID'] == $route_id && $mp == $part['STEP']) {
                                        ?>
                                            <tr class="draggable">
                                                <td><?php echo $part['ENGR_TESTER']; ?></td>
                                                <td><?php echo $part['ENGR_HANDLER']; ?></td>
                                                <td><?php echo $part['ATOM_TESTER']; ?></td>
                                                <td><?php echo $part['ATOM_HANDLER']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                                <td><?php echo $part['TEMP']; ?></td>
                                            </tr>
                                        <?php
                                        }
                                    }
                                ?>
                            </tbody>
                        </table>

                    </div>
                </div>

            <?php
            }

        }
            
            echo "<pre>", var_dump($part_data), "</pre>";
    ?>

    <div class="container mt-4">

  <!-- ===== SET 1 ===== -->
  <div class="swap-set mb-5">
    <div class="row">

      <!-- TABLE 1 (drop) -->
      <div class="col-md-6">
        <h5>Table 1 (Drop Section)</h5>
        <table class="table table-bordered">
          <tbody class="table1">
            <tr class="draggable">
              <td>Set 1 - Element 1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TABLE 2 (source) -->
      <div class="col-md-6">
        <h5>Table 2 (Draggable Rows)</h5>
        <table class="table table-bordered">
          <tbody class="table2">
            <tr class="draggable"><td>Set 1 - Element 2</td></tr>
            <tr class="draggable"><td>Set 1 - Element 3</td></tr>
            <tr class="draggable"><td>Set 1 - Element 4</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>

  <!-- ===== SET 2 ===== -->
  <div class="swap-set mb-5">
    <div class="row">

      <div class="col-md-6">
        <h5>Table 1 (Drop Section)</h5>
        <table class="table table-bordered">
          <tbody class="table1">
            <tr class="draggable">
              <td>Set 2 - Element 1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="col-md-6">
        <h5>Table 2 (Draggable Rows)</h5>
        <table class="table table-bordered">
          <tbody class="table2">
            <tr class="draggable"><td>Set 2 - Element 2</td></tr>
            <tr class="draggable"><td>Set 2 - Element 3</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>

</div>

</div>

<script>
function initTableDragDrop() {

  // Make rows draggable
  $("tr.draggable").draggable({
    helper: "clone",    // clone keeps the table structure while dragging
    cursor: "move",
    revert: "invalid",
    start: function (event, ui) {
      // optional: set width so helper matches original row
      ui.helper.width($(this).width());
    }
  });

  // Table1 droppable (single row section)
  $(".table1").droppable({
    accept: function (dragged) {
      // only accept rows from the same swap-set
      return $(this).closest(".swap-set")[0] ===
             dragged.closest(".swap-set")[0];
    },
    drop: function (event, ui) {
      const $set = $(this).closest(".swap-set");
      const $table1 = $set.find(".table1");
      const $table2 = $set.find(".table2");

      const $dragged = ui.draggable;
      const $existing = $table1.find("tr.draggable");

      // Move existing row in table1 back to top of table2
      if ($existing.length) {
        $existing.detach().prependTo($table2);
      }

      // Move dragged row into table1
      $dragged.detach().appendTo($table1);

      // Rebind draggable for the moved rows
      initTableDragDrop();
    }
  });
}

$(initTableDragDrop);

</script>