namespace eval colour {

proc bright_rgb {colour} {
	switch -- $colour {
		"blue" {return "0000ff"}
		"green" {return "00ff00"}
		"red" {return "ff0000"}
		"teal" {return "00ffff"}
		"magenta" {return "ff00ff"}
		"yellow" {return "ffff00"}
		"white" {return "ffffff"}
		default {return "000000"}
	}
}

proc dull_rgb {colour} {
	switch -- $colour {
		"blue" {return "5555ff"}
		"green" {return "55ff55"}
		"red" {return "ff5555"}
		"teal" {return "55ffff"}
		"magenta" {return "ff55ff"}
		"yellow" {return "ffff55"}
		"white" {return "ffffff"}
		default {return "555555"}
	}
}

proc rgb_short {short} {
	switch -- $short {
		"r" {return "ff0000"}
		"g" {return "00ff00"}
		"b" {return "0000ff"}
		"rg" {return "ffff00"}
		"rb" {return "ff00ff"}
		"gb" {return "00ffff"}
		"rgb" {return "ffffff"}
		default {return "000000"}
	}
} 

proc combine {colour_list} {
	set colour_key [join [lsort -unique $colour_list] {}]
	switch -- $colour_key {
		"blue" {return "blue"}
		"green" {return "green"}
		"red" {return "red"}
		"bluegreen" {return "teal"}
		"bluered" {return "magenta"}
		"greenred" {return "yellow"}
		"bluegreenred" {return "white"}
		default {return ""}
	}
}

proc random_primary {rgb} {

	set rgb_list [split $rgb {}]
	set index  [expr {int(rand()*[llength $rgb_list])}]
	set c [lindex $rgb_list $index]
	return [primary $c]
}

proc primary {short_code} {
	switch -- $short_code {
		"r" { return "red" }
		"g" { return "green" }
		"b" { return "blue" }
	}
}

proc primaries {} {
	return {"red" "green" "blue"}
}

}