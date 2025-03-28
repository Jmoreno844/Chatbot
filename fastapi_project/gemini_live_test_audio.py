import asyncio
import json
import websockets
import requests
import base64
import os


async def test_gemini_live_audio():
    # Create a session
    response = requests.post("http://localhost:8000/api/sessions")
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"Created session: {session_id}")

    # Connect to WebSocket
    uri = f"ws://localhost:8000/api/ws/{session_id}"
    async with websockets.connect(uri) as websocket:
        # Receive welcome message
        response = await websocket.recv()
        print(f"Server: {json.loads(response)['content']}")

        # Path to audio file - adjust as needed
        audio_file_path = "/home/juan/Downloads/converted_audio.wav"

        # Make sure the file exists
        if not os.path.exists(audio_file_path):
            print(f"Error: Audio file not found at {audio_file_path}")
            return

        # Read the audio file as-is
        with open(audio_file_path, "rb") as audio_file:
            audio_content = audio_file.read()

        # Log audio properties
        import wave

        with wave.open(audio_file_path, "rb") as wf:
            print(f"Channels: {wf.getnchannels()}")
            print(f"Sample width: {wf.getsampwidth()}")
            print(f"Frame rate: {wf.getframerate()}")
            print(f"Frames: {wf.getnframes()}")

        print(f"File size: {len(audio_content)} bytes")

        # Encode the whole WAV file in base64
        base64_audio = base64.b64encode(audio_content).decode("utf-8")

        # Send audio message
        message = {"type": "audio", "content": base64_audio}
        await websocket.send(json.dumps(message))
        print(f"Sent audio file: {audio_file_path}")

        # Receive responses until final message
        complete_response = ""
        while True:
            response = await websocket.recv()
            data = json.loads(response)

            if data["type"] == "text" and data["content"]:
                print(f"Received text: {data['content']}")
                complete_response += data["content"]
            elif data["type"] == "audio":
                print(f"Received audio chunk")

            if data.get("is_final", False):
                break

        print(f"\nComplete response: {complete_response}")


if __name__ == "__main__":
    asyncio.run(test_gemini_live_audio())
