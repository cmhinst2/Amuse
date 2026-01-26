package com.muse.amuze.common.util;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Utility {

	public static int seqNum = 1;

	public static String fileRename(String originalFileName) {

		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		String date = sdf.format(new Date());

		String number = String.format("%05d", seqNum);

		seqNum++; // 1증가
		if (seqNum == 100000)
			seqNum = 1;

		String ext = originalFileName.substring(originalFileName.lastIndexOf("."));
		return date + "_" + number + ext;
	}
}
