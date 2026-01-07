<?php

function SEARCH_INPUT_GROUP($class, $placeholder, $attribute = null, $size = null, $position = null){

    echo 
        '<div class="input-group '.$position.' '.$size.'">
            <input type="text" '.$attribute.' class="form-control '.$class.'" placeholder="'.$placeholder.'">
            <button class="btn btn-outline-secondary" type="button" id="button-addon2">
                <i class="fa-solid fa-magnifying-glass"></i>
            </button>
        </div>';
}

?>