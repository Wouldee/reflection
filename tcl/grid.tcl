
namespace eval ::grid {

variable grid

proc new {tiling size continuous_x continuous_y border_id} { 
	variable grid {}

	# reset/intialise the tile data
	namespace eval :: {source tile.tcl}

	# store the size, border_id
	dict set grid tiling $tiling
	dict set grid size $size
	dict set grid continuous_x $continuous_x
	dict set grid continuous_y $continuous_y
	dict set grid border_id $border_id

	dict set grid scrollx 0
	dict set grid scrolly 0

	# find the border coordinates, set pixels, tile size
	::tile::new_grid
	::tiling::new_grid $tiling
}

proc get {args} {
	variable grid
	return [dict get $grid {*}$args]
}

proc set {args} {
	variable grid
	dict set grid {*}$args
}

proc exists {args} {
	variable grid
	return [dict exists $grid {*}$args]
}

proc unset {args} {
	variable grid
	dict unset grid {*}$args
}

proc incr {key {by 1}} {
	variable grid
	return [dict incr grid $key $by]
}

proc lappend {args} {
	variable grid

	::set keys [lrange $args 0 end-1]
	::set element [lindex $args end]

	::set list_value [eval "[list dict get $grid] $keys"]
	return [eval "dict set grid $keys [lappend list_value $element]"]
}

proc keys {args}  {
	variable grid
	return [dict keys [eval "[list dict get $grid $args]"]]
}

}
