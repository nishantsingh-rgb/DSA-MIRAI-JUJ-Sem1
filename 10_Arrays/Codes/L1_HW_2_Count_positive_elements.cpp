#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {3, -1, 0, 7, -5, 2, 0, 9};
    int count = 0;

    cout << "Positive elements: ";
    for (int x : arr) {
        if (x > 0) {                    // 0 is NOT positive
            cout << x << " ";
            count++;
        }
    }
    cout << endl;
    cout << "Count of positive elements = " << count << endl;
    return 0;
}
