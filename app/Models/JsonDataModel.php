<?php

namespace App\Models;
use GuzzleHttp;

class JsonDataModel
	{
	private $filename = '';
	
	public function __construct($file)
		{
		$this->filename = $file;
		}
	
	public function getData()
		{
		$content = file_get_contents($this->filename);
		$content = json_decode($content);
		
		return $content;
		}
	}
