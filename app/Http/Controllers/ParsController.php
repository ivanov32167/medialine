<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\JsonDataModel;

class ParsController extends Controller
	{
	
    public function index()
		{
		$json_model = new JsonDataModel('news.json');
		
		$news_arr = $json_model->getData();
		
		

		
		return view('welcome', compact('news_arr'));
		}
	}