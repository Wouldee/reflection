namespace eval ::widget {

proc text {x y anchor text size args} {

	# process args
	set item_args [::process_args options $args {click "" colour "white" font "avantgarde"}]

	set text_id [[::screen] create text $x $y \
		-anchor $anchor \
		-text $text \
		-font [list $options(font) $size] \
		-fill $options(colour) \
		{*}$item_args]

	if {$options(click)!=""} {
		[screen] bind $text_id <Button-1> $options(click)
		[screen] bind $text_id <Enter> "[screen] itemconfigure $text_id -fill [::colour::active_button $options(colour)]"
		[screen] bind $text_id <Leave> "[screen] itemconfigure $text_id -fill $options(colour)"
	}

	return $text_id
}

proc timer {x y anchor size args} {
	set timer_id [text $x $y $anchor "00:00:00" $size {*}$args]
	namespace eval "::timer$timer_id" {variable clock}
	::timer::reset $timer_id
	return $timer_id
}

proc progress_bar {x y width height args} {
	set item_args [::process_args options $args {colour "white" width 3}]

	set x1 [expr {$x - ($width/2)}]
	set y1 [expr {$y - ($height/2)}]
	set x2 [expr {$x + ($width/2)}]
	set y2 [expr {$y + ($height/2)}]

	set progress_id [[::screen] create rectangle $x1 $y1 $x2 $y2 -fill "" -outline $options(colour) -width $options(width) {*}$item_args]

	namespace eval "::progress_bar$progress_id" {
		variable progress_bar
		variable coords
	}

	set ::progress_bar${progress_id}::coords [list $x1 $y1 $x2 $y2]
	set ::progress_bar${progress_id}::progress_bar [[::screen] create rectangle $x1 $y1 [expr {$x1+1}] $y2 -fill $options(colour) -outline "" -width 0 {*}$item_args]

	return $progress_id
}
}

namespace eval ::text {
proc update {text_id text} {
	[::screen] itemconfigure $text_id -text $text
}

proc size {text_id size} {
	[::screen] itemconfigure $text_id -font [list avantgarde $size]
}

proc colour {text_id colour} {
	[::screen] itemconfigure $text_id -fill $colour
}

}

namespace eval ::timer {

proc start {timer_id} {
	set ::timer${timer_id}::clock(running) 1
	set ::timer${timer_id}::clock(start) [expr {[set ::timer${timer_id}::clock(start)] + [clock microseconds]-[set ::timer${timer_id}::clock(stopped)]}]
	after idle "::timer::update $timer_id"
}

proc stop {timer_id} {
	set ::timer${timer_id}::clock(running) 0
	set ::timer${timer_id}::clock(stopped) [clock microseconds]
	return [duration $timer_id]
}

proc reset {timer_id} {
	set ::timer${timer_id}::clock(start) [clock microseconds]
	set ::timer${timer_id}::clock(last) [clock microseconds]
	set ::timer${timer_id}::clock(stopped) [clock microseconds]
}

proc update {timer_id} {
	set now [clock microseconds]
	if {$now!=[set ::timer${timer_id}::clock(last)]} {
		set ::timer${timer_id}::clock(last) $now
		set start [set ::timer${timer_id}::clock(start)]
		set duration [expr {($now-$start)/1000000}]
		[::screen] itemconfigure $timer_id -text [::display_time $duration]
	}

	if {[set ::timer${timer_id}::clock(running)]} {
		after 100 "::timer::update $timer_id"
	}
}

proc duration {timer_id {duration ""}} {
	set now [clock microseconds]

	if {$duration!=""} {
		set ::timer${timer_id}::clock(start) [expr {$now - 1000000*$duration}]
	} else {
		set start [set ::timer${timer_id}::clock(start)]
		set duration [expr {($now - $start)/1000000}]
	}
	return $duration
}

}

namespace eval ::progress_bar {

proc reset {progress_id} {
	[::screen] delete [set ::progress_bar${progress_id}::progress_bar]
	lassign [set ::progress_bar${progress_id}::coords] x1 y1 x2 y2
	set ::progress_bar${progress_id}::progress_bar [[::screen] create rectangle $x1 $y1 [expr {$x1+1}] $y2 -fill $options(colour) -outline "" -width 0]
}

proc update {progress_id percent} {
	lassign [set ::progress_bar${progress_id}::coords] x1 y1 x2 y2

	set width [expr {$percent*($x2-$x1)/100.0}]
	[::screen] coords [set ::progress_bar${progress_id}::progress_bar] $x1 $y1 [expr {$x1+$width}] $y2
}

}