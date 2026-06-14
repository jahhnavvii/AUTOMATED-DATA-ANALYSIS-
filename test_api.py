import httpx
import time
import json
import asyncio

async def test_pipeline():
    base_url = "http://localhost:8000"
    
    # 1. Login to get a token
    print("Logging in...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Assuming test@test.com and Test1234! is registered. Let's register it just in case.
        try:
            reg_res = await client.post(f"{base_url}/auth/register", json={"username": "test2@test.com", "password": "Test1234!", "full_name": "Test User"})
            print("Register:", reg_res.status_code, reg_res.text)
        except Exception as e:
            print(e)
            
        login_res = await client.post(f"{base_url}/auth/login", json={"username": "test2@test.com", "password": "Test1234!"})
        print("Login:", login_res.status_code)
        if login_res.status_code != 200:
            print("Login failed!", login_res.text)
            return
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Upload dataset
        print("Uploading dataset...")
        with open("test_data.csv", "rb") as f:
            files = {"file": ("test_data.csv", f, "text/csv")}
            up_res = await client.post(f"{base_url}/upload", files=files, headers=headers)
            print("Upload:", up_res.status_code, up_res.text)
            if up_res.status_code != 200:
                return
            data = up_res.json()
            project_id = data["project_id"]
            dataset_id = data["dataset_id"]
            
        # 3. Get domains
        print("Getting domains...")
        dom_res = await client.get(f"{base_url}/pipeline/domains/{dataset_id}", headers=headers)
        print("Domains:", dom_res.status_code, dom_res.text)
        if dom_res.status_code != 200:
            return
            
        # 4. Start pipeline
        print("Starting pipeline...")
        pipe_res = await client.post(f"{base_url}/pipeline/start", json={"project_id": project_id, "dataset_id": dataset_id, "prediction_task": "test prediction"}, headers=headers)
        print("Start:", pipe_res.status_code, pipe_res.text)
        if pipe_res.status_code != 200:
            return
            
        # 5. Check status
        print("Checking status...")
        for i in range(10):
            time.sleep(2)
            stat_res = await client.get(f"{base_url}/pipeline/status/{project_id}", headers=headers)
            print("Status:", stat_res.json()["status"])
            if stat_res.json()["status"] in ["done", "failed"]:
                print("Logs:", json.dumps(stat_res.json()["logs"], indent=2))
                break

if __name__ == "__main__":
    asyncio.run(test_pipeline())
