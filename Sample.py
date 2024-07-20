from flask import Flask, request, render_template, jsonify
import os
import pandas as pd
import speech_recognition as sr

app = Flask(__name__)

recognizer = sr.Recognizer()

def load_existing_data(csv_file):
    if os.path.exists(csv_file):
        return pd.read_csv(csv_file)
    else:
        return pd.DataFrame(columns=["Tree Name", "Status", "Color"])

def update_tree_status(df, new_status, new_color):
    tree_name = len(df) + 1
    new_row = pd.DataFrame({"Tree Name": [tree_name], "Status": [new_status], "Color": [new_color]})
    df = pd.concat([df, new_row], ignore_index=True)
    return df

def delete_tree_status(df, tree_name):
    df = df[df["Tree Name"] != tree_name]
    return df

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    csv_file = "tree_status.csv"
    df = load_existing_data(csv_file)
    
    text = request.form['speech_text']
    new_status, new_color = process_tree_status(text)
    
    if new_status:
        df = update_tree_status(df, new_status, new_color)
        df.to_csv(csv_file, index=False)
    
    return jsonify(df.to_dict(orient='records'))

@app.route('/delete', methods=['POST'])
def delete():
    tree_name = int(request.form['tree_name'])
    csv_file = "tree_status.csv"
    df = load_existing_data(csv_file)
    
    df = delete_tree_status(df, tree_name)
    df.to_csv(csv_file, index=False)
    
    return jsonify(df.to_dict(orient='records'))

@app.route('/data', methods=['GET'])
def get_data():
    csv_file = "tree_status.csv"
    df = load_existing_data(csv_file)
    return jsonify(df.to_dict(orient='records'))

def process_tree_status(text):
    status, color = None, None
    if text:
        if "good" in text.lower():
            status = "good"
            color = "green"
        elif "bad" in text.lower():
            status = "bad"
            color = "red"
    return status, color

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio_data' not in request.files:
        return jsonify({'error': 'No audio data provided'}), 400
    
    audio_file = request.files['audio_data']
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)
    
    try:
        text = recognizer.recognize_google(audio)
        return jsonify({'text': text})
    except sr.UnknownValueError:
        return jsonify({'error': 'Could not understand the audio'}), 400
    except sr.RequestError as e:
        return jsonify({'error': f'Error with the recognition service: {e}'}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
