
source globals.tcl
source rgb.tcl
source grid.tcl
source tile.tcl
source tiling.tcl
source geometry.tcl
source game.tcl
source generate.tcl
source store.tcl
source widget.tcl
source paths.tcl
source colour.tcl
source library.tcl
source filter.tcl
source teleporter.tcl
source stats.tcl
catch { source ../dictree.tcl }

# bug loading truncated square tilings:
catch { file delete "store/24.store" ; file delete "store/16.store" ; file delete "store/8.store" ; }

proc home {} {
	catch {[::screen delete home]}

	bind . <Key-F11> ::full_screen
	bind . <Key-Escape> ::full_screen

	set centre [expr {$::width/2}]

	# overall stats top right corner
	widget::text $::width 10 e "[format %.0f [::stats::total moves]]/[format %.0f [::stats::total par]] MOVES" 10 -tags {"home"}
	widget::text $::width 22 e "[::display_time [::stats::total time]]" 10 -tags {"home"}
	widget::text $::width 34 e "[::comma_number [expr {round([::stats::total score])}]]" 10 -tags {"home"}
	widget::text $::width 46 e "[format %.2f [::stats::average rating]]%" 10 -tags {"home"}

	# game title
	widget::text $centre 150 center "REFLECTION" 40 -tags {"home"}

	display_levels

	# buttons
	# set id [widget::text $centre 250 center "OPTIONS" 30 -tags {"home"} -click "::options"]
	# set id [widget::text $centre 325 center "FEATS" 30 -tags {"home"} -click "::feats"]

	# set id [widget::text $centre 400 center "PLAY" 30 -tags {"home"} -click "::play"]
	# set id [widget::text $centre 440 center "RANDOM" 16 -tags {"home"} -click "::display_levels"]

	set id [widget::text $centre [expr {$::height-50}] center "GET ME OUT OF HERE" 30 -tags {"home"} -click "exit 0"]
}

proc options {} {}
proc feats {} {}

proc play {} {
	[screen] delete all
	coroutine game ::game::play truncatedSquare 16
}

proc display_levels {} {
	set height [expr {$::height - 480.0}]
	set width [expr {$height}]
	set tile_size [expr {$height/5}]

	set x1 [expr {round($::width/2 - $width/2)}]
	set x2 [expr {round($x1 + $width)}]
	set y2 [expr {round($::height - 120)}]
	set y1 [expr {round($y2 - $height)}]

	# [screen] create rectangle $x1 $y1 $x2 $y2 -fill black -outline white

	set level_index 0
	for {set row 0} {$row<5} {incr row} {
		set y [expr {round($y1+$tile_size*$row)}]
		for {set column 0} {$column<5} {incr column} {
			set x [expr {round($x1+$tile_size*$column)}]
			set level_tag [level_icon $level_index $x $y $tile_size]
			[screen] bind $level_tag <Button-1> "select_level $level_index"
			incr level_index
		}
	}
}

proc level_icon {index x y tile_size} {
	set arguments [lassign [lindex $::levels $index] level tiling game_size]
	set game_args [::process_args options $arguments {continuous_x 1 continuous_y 1 rgb "rgb" mix 1 filter 1}]

	set colour [::colour::rgb_short $options(rgb)]
	set tag "level $level"
	set textFill "black"

	switch -- $tiling {
		"triangular" {
			set size [expr {9*$tile_size/10}]
			set xt [expr {$x+$tile_size/2}]
			set yt [expr {$y+(40-$::Q3)*$tile_size/40}]
			::geometry::equilateralTriangle $xt $yt s $size -fill #$colour -tags [list $tag levels]
		}
		"elongatedTriangular" {
			set textFill "white"
			set size [expr {3*$tile_size/10}]
			set xs1 [expr {$x+$tile_size/2}]
			set ys1 [expr {$y+$tile_size/2}]
			::geometry::square $xs1 $ys1 straight $size -fill "black" -tags [list $tag levels]
			set xs2 [expr {$x+$tile_size/2}]
			set ys2 [expr {$y+$tile_size/5}]
			::geometry::square $xs2 $ys2 straight $size -fill #$colour -tags [list $tag levels]
			set xs2 [expr {$x+$tile_size/2}]
			set ys2 [expr {$y+4*$tile_size/5}]
			::geometry::square $xs2 $ys2 straight $size -fill #$colour -tags [list $tag levels]
			set xt1 [expr {$x+$tile_size*(7-3*$::Q3)/20}]
			set yt1 [expr {$y+$tile_size/2}]
			::geometry::equilateralTriangle $xt1 $yt1 w $size -fill #$colour -tags [list $tag levels]
			set xt2 [expr {$x+$tile_size*(13+3*$::Q3)/20}]
			set yt2 [expr {$y+$tile_size/2}]
			::geometry::equilateralTriangle $xt2 $yt2 e $size -fill #$colour -tags [list $tag levels]
		}
		"snubSquare" {
			set textFill "white"
			set size [expr {9*$tile_size/(5*($::Q3+3))}]
			set xs [expr {$x+$tile_size/2}]
			set ys [expr {$y+$tile_size/2}]
			::geometry::square $xs $ys left $size -fill "black" -tags [list $tag levels]
			set xt1 [expr {$x+$tile_size/20 + $size/2}]
			set yt1 [expr {$y+$tile_size/20 + $size}]
			::geometry::equilateralTriangle $xt1 $yt1 n $size -fill #$colour -tags [list $tag levels]
			set xt2 [expr {$x+$tile_size/20 + $size*($::Q3+1)/2}]
			set yt2 [expr {$y+$tile_size/20 + $size/2}]
			::geometry::equilateralTriangle $xt2 $yt2 e $size -fill #$colour -tags [list $tag levels]
			set xt3 [expr {$x+$tile_size/20 + $size*($::Q3+2)/2}]
			set yt3 [expr {$y+$tile_size/20 + $size*($::Q3+1)/2}]
			::geometry::equilateralTriangle $xt3 $yt3 s $size -fill #$colour -tags [list $tag levels]
			set xt4 [expr {$x+$tile_size/20 + $size}]
			set yt4 [expr {$y+$tile_size/20 + $size*($::Q3+2)/2}]
			::geometry::equilateralTriangle $xt4 $yt4 w $size -fill #$colour -tags [list $tag levels]
		}
		"squares" {
			set size [expr {9*$tile_size/10}]
			set xs [expr {$x+$tile_size/2}]
			set ys [expr {$y+$tile_size/2}]
			::geometry::square $xs $ys straight $size -fill #$colour -tags [list $tag levels]
		}
		"hexagonal" {
			set size [expr {9*$tile_size/20}]
			set xh [expr {$x+$tile_size/2}]
			set yh [expr {$y+$tile_size/2}]
			::geometry::hexagon $xh $yh standing $size -fill #$colour -tags [list $tag levels]
		}
		"trihexagonal" {
			set textFill "white"
			set size [expr {9*$tile_size/(20*$::Q3)}]
			set xh [expr {$x+$tile_size/2}]
			set yh [expr {$y+$tile_size/2}]
			::geometry::hexagon $xh $yh standing $size -fill "black" -tags [list $tag levels]
			set xt1 [expr {$x+$tile_size/2}]
			set yt1 [expr {$y+$tile_size/20}]
			::geometry::equilateralTriangle $xt1 $yt1 n $size -fill #$colour -tags [list $tag levels]
			set xt2 [expr {$x+$tile_size/2+$size}]
			set yt2 [expr {$y+$tile_size/2}]
			::geometry::equilateralTriangle $xt2 $yt2 s $size -fill #$colour -tags [list $tag levels]
			::geometry::equilateralTriangle $xt2 $yt2 n $size -fill #$colour -tags [list $tag levels]
			set xt3 [expr {$x+$tile_size/2}]
			set yt3 [expr {$y+19*$tile_size/20}]
			::geometry::equilateralTriangle $xt3 $yt3 s $size -fill #$colour -tags [list $tag levels]
			set xt4 [expr {$x+$tile_size/2-$size}]
			set yt4 [expr {$y+$tile_size/2}]
			::geometry::equilateralTriangle $xt4 $yt4 s $size -fill #$colour -tags [list $tag levels]
			::geometry::equilateralTriangle $xt4 $yt4 n $size -fill #$colour -tags [list $tag levels]
		}
		"rhombitrihexagonal" {
			set textFill "white"
			set size [expr {9*$tile_size/(10*($::Q3+2))}]
			set xh [expr {$x+$tile_size/2}]
			set yh [expr {$y+$tile_size/2}]
			::geometry::hexagon $xh $yh standing $size -fill "black" -tags [list $tag levels]
			set xs1 [expr {$x+$tile_size/20 + $size*($::Q3+3)/4}]
			set ys1 [expr {$y+$tile_size/2  - $size*($::Q3+3)/4}]
			::geometry::square $xs1 $ys1 left $size -fill #$colour -tags [list $tag levels]
			set xs2 [expr {$x+$tile_size/20 + $size*(3*$::Q3+5)/4}]
			set ys2 $ys1
			::geometry::square $xs2 $ys2 right $size -fill #$colour -tags [list $tag levels]
			set xs3 [expr {$x+$tile_size/20 + $size*(2*$::Q3+3)/2}]
			set ys3 [expr {$y+$tile_size/2}]
			::geometry::square $xs3 $ys3 straight $size -fill #$colour -tags [list $tag levels]
			set xs4 $xs2
			set ys4 [expr {$y+$tile_size/2  + $size*($::Q3+3)/4}]
			::geometry::square $xs4 $ys4 left $size -fill #$colour -tags [list $tag levels]
			set xs5 $xs1
			set ys5 $ys4
			::geometry::square $xs5 $ys5 right $size -fill #$colour -tags [list $tag levels]
			set xs6 [expr {$x+$tile_size/20 + $size/2}]
			set ys6 $ys3
			::geometry::square $xs6 $ys6 straight $size -fill #$colour -tags [list $tag levels]
		}
		"truncatedSquare" {
			set size [expr {9*$tile_size/30}]
			set xh [expr {$x+$tile_size/2}]
			set yh [expr {$y+$tile_size/2}]
			::geometry::octagon $xh $yh $size -fill #$colour -tags [list $tag levels]
		}
		"random" {set textFill "white"}
	}

	set size [expr {round(2*$tile_size/7)}]
	set xt [expr {$x+$tile_size/2}]
	set yt [expr {$y+$tile_size/2}]
	widget::text $xt $yt center $level $size -tags [list $tag levels] -colour $textFill

	return $tag
}

proc select_level {index} {
	[screen] delete all
	set play_args [lassign [lindex $::levels $index] level]
	coroutine game ::game::play {*}$play_args -level $level
}

proc logToFile {msg {level 0}} {
	if {$level>$::log_level} return

	set fid [open $::logFile a]
	puts $fid "\[[clock format [clock seconds] -format {%H:%M:%S}]\]$msg"
	close $fid
}

proc factorial {x} {
	if {$x==1} {return 1}
	return [expr {$x*[factorial [expr {$x-1}]]}]
}

proc full_screen {} {
	set fullscreen [wm attributes . -fullscreen]
	if {$fullscreen} {
		[screen] configure -width $::original_width -height $::original_height
		wm attributes . -fullscreen 0
		wm geometry . "${::original_width}x${::original_height}"
		set ::width $::original_width
		set ::height $::original_height
	} else {
		set ::original_width $::width
		set ::original_height $::height
		wm attributes . -fullscreen 1

		set geometry [wm geometry .]
		scan $geometry "%dx%d+%d+%d" width height x y

		set ::width $width
		set ::height $height
		[screen] configure -width $::width -height $::height
	}
}

proc screen {} {return $::c}


set c [canvas .c -width $::width -height $::height -bg black]
pack [screen] -expand yes -fill both
::stats::load
home

